"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskModal } from "@/components/task-modal";

const STATUS_MAP = {
  TODO: { label: "Yapılacak", color: "bg-yellow-500/15 text-yellow-400 border-0" },
  IN_PROGRESS: { label: "Devam Ediyor", color: "bg-blue-500/15 text-blue-400 border-0" },
  DONE: { label: "Tamamlandı", color: "bg-green-500/15 text-green-400 border-0" },
};

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  deadline?: Date | string | null;
  assignee?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  _count?: { comments: number };
}

export function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_MAP[task.status];

  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== "DONE";
  const deadlineStr = deadline?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all group"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.status === "DONE" ? "bg-green-500" :
          task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-yellow-500"
        }`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === "DONE" ? "line-through text-gray-600" : "text-gray-200"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.project && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                {task.project.name}
              </span>
            )}
            {deadline && (
              <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-gray-600"}`}>
                {isOverdue ? "⚠ " : ""}{deadlineStr}
              </span>
            )}
            {(task._count?.comments ?? 0) > 0 && (
              <span className="text-xs text-gray-600">💬 {task._count!.comments}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs px-2 py-0.5 font-normal ${status.color}`}>
            {status.label}
          </Badge>
          {task.assignee && (
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.assignee.image ?? ""} />
              <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{task.assignee.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      <TaskModal taskId={task.id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
