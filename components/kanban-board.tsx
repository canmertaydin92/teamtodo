"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskModal } from "@/components/task-modal";

const STATUS_CONFIG = {
  TODO: {
    label: "Yapılacak",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-yellow-400",
    dot: "bg-yellow-500",
    dropActive: "ring-2 ring-yellow-500/40 bg-yellow-500/5",
  },
  IN_PROGRESS: {
    label: "Devam Ediyor",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-blue-400",
    dot: "bg-blue-500",
    dropActive: "ring-2 ring-blue-500/40 bg-blue-500/5",
  },
  DONE: {
    label: "Tamamlandı",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-green-400",
    dot: "bg-green-500",
    dropActive: "ring-2 ring-green-500/40 bg-green-500/5",
  },
} as const;

type Status = keyof typeof STATUS_CONFIG;

interface Task {
  id: string;
  title: string;
  status: Status;
  deadline?: Date | string | null;
  assignee?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  _count?: { comments: number };
}

export function KanbanBoard({ tasks: initialTasks, showAssignee = false }: { tasks: Task[]; showAssignee?: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const grouped = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Status;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              showAssignee={showAssignee}
              activeId={activeId}
              onCardClick={(id) => setSelectedTaskId(id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="rotate-2 opacity-95 shadow-2xl shadow-black/40">
              <CardContent task={activeTask} showAssignee={showAssignee} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          open={true}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}

function KanbanColumn({
  status,
  tasks,
  showAssignee,
  activeId,
  onCardClick,
}: {
  status: Status;
  tasks: Task[];
  showAssignee: boolean;
  activeId: string | null;
  onCardClick: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 transition-all ${cfg.bg} ${
        isOver ? cfg.dropActive : ""
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-800">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`text-sm font-semibold ${cfg.headerText}`}>{cfg.label}</span>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 ${cfg.headerText}`}>
          {tasks.length}
        </span>
      </div>

      <div className="p-3 space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            showAssignee={showAssignee}
            isBeingDragged={activeId === task.id}
            onClick={() => onCardClick(task.id)}
          />
        ))}
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-700 italic select-none">
            Görev yok
          </div>
        )}
        {isOver && (
          <div className="h-16 rounded-xl border-2 border-dashed border-indigo-700 bg-indigo-500/5 flex items-center justify-center text-xs text-indigo-500">
            Buraya bırak
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  task,
  showAssignee,
  isBeingDragged,
  onClick,
}: {
  task: Task;
  showAssignee: boolean;
  isBeingDragged: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isBeingDragged ? "opacity-30" : ""}`}
    >
      {/* Sürükleme tutacağı — sadece bu alan drag'i tetikler */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2.5 right-2.5 p-1 touch-none cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-500 z-10"
        title="Sürükle"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="9" cy="8" r="1.5" />
          <circle cx="3" cy="13" r="1.5" />
          <circle cx="9" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Kartın geri kalanına dokunmak modal açar, scroll'u bozmaz */}
      <div onClick={onClick}>
        <CardContent task={task} showAssignee={showAssignee} />
      </div>
    </div>
  );
}

function CardContent({
  task,
  showAssignee,
  isDragging = false,
}: {
  task: Task;
  showAssignee: boolean;
  isDragging?: boolean;
}) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== "DONE";
  const deadlineStr = deadline?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? "" : "hover:border-gray-600"
      }`}
    >
      <p className={`text-sm font-medium leading-snug mb-2 ${
        task.status === "DONE" ? "line-through text-gray-600" : "text-gray-200"
      }`}>
        {task.title}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {task.project && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} />
              {task.project.name}
            </span>
          )}
          {deadline && (
            <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-gray-600"}`}>
              {isOverdue ? "⚠ " : "📅 "}{deadlineStr}
            </span>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-xs text-gray-600">💬 {task._count!.comments}</span>
          )}
        </div>

        {showAssignee && task.assignee && (
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarImage src={task.assignee.image ?? ""} />
            <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{task.assignee.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {showAssignee && task.assignee && (
        <p className="text-xs text-gray-600 mt-1.5 truncate">{task.assignee.name}</p>
      )}
    </div>
  );
}
