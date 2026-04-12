"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskModal } from "@/components/task-modal";

const STATUS_CONFIG = {
  TODO: {
    label: "Yapılacak",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-yellow-400",
    dot: "bg-yellow-500",
    dropHover: "ring-yellow-500/40 bg-yellow-500/5",
  },
  IN_PROGRESS: {
    label: "Devam Ediyor",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-blue-400",
    dot: "bg-blue-500",
    dropHover: "ring-blue-500/40 bg-blue-500/5",
  },
  DONE: {
    label: "Tamamlandı",
    bg: "bg-gray-900 border-gray-800",
    headerText: "text-green-400",
    dot: "bg-green-500",
    dropHover: "ring-green-500/40 bg-green-500/5",
  },
} as const;

type Status = keyof typeof STATUS_CONFIG;

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: Status;
  deadline?: Date | string | null;
  assignee?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  _count?: { comments: number };
}

interface KanbanBoardProps {
  tasks: Task[];
  showAssignee?: boolean;
}

export function KanbanBoard({ tasks: initialTasks, showAssignee = false }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const grouped = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  function onDragStart(taskId: string) {
    dragId.current = taskId;
    setDragging(taskId);
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragId.current = null;
  }

  async function onDrop(status: Status) {
    const taskId = dragId.current;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) {
      setDragging(null);
      setDragOver(null);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    setDragging(null);
    setDragOver(null);

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <>
      <div className="flex md:grid md:grid-cols-3 gap-4 h-full overflow-x-auto pb-2 snap-x snap-mandatory">
        {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const columnTasks = grouped[status];
          const isOver = dragOver === status;

          return (
            <div
              key={status}
              className={`rounded-2xl border-2 transition-all flex-shrink-0 w-[80vw] md:w-auto snap-center ${cfg.bg} ${
                isOver ? `ring-2 ${cfg.dropHover}` : ""
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(status)}
            >
              <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-800">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className={`text-sm font-semibold ${cfg.headerText}`}>{cfg.label}</span>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 ${cfg.headerText}`}>
                  {columnTasks.length}
                </span>
              </div>

              <div className="p-3 space-y-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    isDragging={dragging === task.id}
                    showAssignee={showAssignee}
                    onDragStart={() => onDragStart(task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}

                {columnTasks.length === 0 && !isOver && (
                  <div className="flex items-center justify-center h-20 text-xs text-gray-700 italic">
                    Görev yok
                  </div>
                )}
                {isOver && dragging && (
                  <div className="h-16 rounded-xl border-2 border-dashed border-indigo-700 bg-indigo-500/5 flex items-center justify-center text-xs text-indigo-500">
                    Buraya bırak
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

function KanbanCard({
  task,
  isDragging,
  showAssignee,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: Task;
  isDragging: boolean;
  showAssignee: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== "DONE";
  const deadlineStr = deadline?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 cursor-grab active:cursor-grabbing hover:border-gray-600 hover:bg-gray-750 transition-all select-none ${
        isDragging ? "opacity-40 rotate-1 shadow-2xl" : "shadow-sm"
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
