"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const STATUS_OPTIONS = [
  { value: "TODO", label: "Yapılacak" },
  { value: "IN_PROGRESS", label: "Devam Ediyor" },
  { value: "DONE", label: "Tamamlandı" },
];

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
}

interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  deadline?: string | null;
  assignee?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  comments: Comment[];
}

export function TaskModal({ taskId, open, onClose }: { taskId: string; open: boolean; onClose: () => void }) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      fetch(`/api/tasks/${taskId}`)
        .then((r) => r.json())
        .then(setTask);
    }
  }, [open, taskId]);

  async function updateStatus(status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTask((t) => (t ? { ...t, status } : t));
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    const newComment = await res.json();
    setTask((t) => (t ? { ...t, comments: [...t.comments, newComment] } : t));
    setComment("");
    setSubmitting(false);
  }

  if (!task) return null;

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold pr-6 text-gray-100">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {task.project && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800 text-gray-400 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                {task.project.name}
              </span>
            )}
            {deadline && (
              <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-400 text-xs">📅 {deadline}</span>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateStatus(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  task.status === opt.value
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {task.assignee && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={task.assignee.image ?? ""} />
                <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{task.assignee.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-400">{task.assignee.name}</span>
            </div>
          )}

          {task.description && (
            <p className="text-sm text-gray-400 bg-gray-800 rounded-lg p-3">{task.description}</p>
          )}

          <Separator className="bg-gray-800" />

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">Yorumlar ({task.comments.length})</p>
            <div className="space-y-3 mb-4">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={c.author.image ?? ""} />
                    <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{c.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-gray-300">{c.author.name}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Yorum yaz..."
                className="text-sm min-h-[60px] resize-none bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) submitComment();
                }}
              />
              <Button
                onClick={submitComment}
                disabled={submitting || !comment.trim()}
                className="self-end text-xs px-3 bg-indigo-600 hover:bg-indigo-500"
              >
                Gönder
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
