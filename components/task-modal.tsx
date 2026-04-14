"use client";

import { useEffect, useRef, useState } from "react";

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], "image.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}
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
  imageUrl?: string | null;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
}

interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  deadline?: string | null;
  assignees?: { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }[];
  project?: { id: string; name: string; color: string } | null;
  comments: Comment[];
}

export function TaskModal({ taskId, open, onClose }: { taskId: string; open: boolean; onClose: () => void }) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitComment() {
    if (!comment.trim() && !imageFile) return;
    setSubmitting(true);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const fd = new FormData();
        fd.append("file", compressed);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (upRes.ok) {
          const data = await upRes.json();
          imageUrl = data.url ?? null;
        } else {
          const err = await upRes.json().catch(() => ({}));
          alert("Fotoğraf yüklenemedi: " + (err.error ?? upRes.status));
          return;
        }
      }

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment, imageUrl }),
      });
      const newComment = await res.json();
      setTask((t) => (t ? { ...t, comments: [...t.comments, newComment] } : t));
      setComment("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      alert("Bağlantı hatası, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!task) return null;

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
    {lightbox && (
      <div
        className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
        onClick={() => setLightbox(null)}
      >
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <img
            src={lightbox}
            alt="tam ekran"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex justify-center p-6 pb-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setLightbox(null)}
            className="flex items-center gap-2 text-white text-base bg-white/15 hover:bg-white/25 px-8 py-3 rounded-full transition-colors font-medium"
          >
            ← Geri
          </button>
        </div>
      </div>
    )}
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

          {(task.assignees?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.assignees!.map(({ user }) => (
                <div key={user.id} className="flex items-center gap-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.image ?? ""} />
                    <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-400">{user.name}</span>
                </div>
              ))}
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
                    {c.content && <p className="text-sm text-gray-400 mt-0.5">{c.content}</p>}
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt="yorum görseli"
                        className="mt-2 rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
                        onClick={() => setLightbox(c.imageUrl!)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Yorum yazma alanı */}
            <div className="space-y-2">
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="önizleme" className="rounded-lg max-h-32 object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Yorum yaz..."
                  className="text-sm min-h-[60px] resize-none bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) submitComment();
                  }}
                />
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 flex items-center justify-center text-gray-400 hover:text-indigo-400 transition-colors"
                    title="Fotoğraf ekle"
                  >
                    📷
                  </button>
                  <Button
                    onClick={submitComment}
                    disabled={submitting || (!comment.trim() && !imageFile)}
                    className="w-9 h-9 p-0 bg-indigo-600 hover:bg-indigo-500 text-xs"
                  >
                    {submitting ? "..." : "↑"}
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
