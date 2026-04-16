"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], "image.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

interface Job {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
}

export function JobsClient({ initialJobs, currentUserId, isAdmin }: {
  initialJobs: Job[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
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

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, imageUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Bir hata oluştu");
        return;
      }

      const job = await res.json();
      setJobs((prev) => [job, ...prev]);
      setTitle("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      alert("Bağlantı hatası, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jobs?id=${id}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setLightbox(null)}>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img src={lightbox} alt="tam ekran" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="flex justify-center p-6 pb-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="flex items-center gap-2 text-white text-base bg-white/15 hover:bg-white/25 px-8 py-3 rounded-full transition-colors font-medium">
              ← Geri
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* İş ekleme formu — sadece admin */}
        {isAdmin && <form onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="İş başlığı *"
            className="w-full text-sm bg-transparent outline-none text-gray-200 placeholder:text-gray-600 font-medium"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Açıklama (isteğe bağlı)..."
            rows={2}
            className="w-full text-sm bg-transparent outline-none resize-none text-gray-300 placeholder:text-gray-600"
          />

          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="önizleme" className="rounded-xl max-h-48 object-cover" />
              <button type="button" onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-gray-800">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
            >
              <span className="text-base">📷</span>
              <span>Fotoğraf ekle</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {submitting ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
        </form>}

        {/* İş listesi */}
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">💼</p>
            <p className="text-sm">Henüz iş yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarImage src={job.author.image ?? ""} />
                      <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{job.author.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-gray-300">{job.author.name}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(job.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(job.id)} className="text-gray-700 hover:text-red-400 text-xs transition-colors flex-shrink-0" title="Sil">
                      🗑
                    </button>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-200 mb-1">{job.title}</p>
                {job.description && (
                  <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                )}
                {job.imageUrl && (
                  <img
                    src={job.imageUrl}
                    alt="iş görseli"
                    className="mt-3 rounded-xl max-w-full max-h-72 object-cover cursor-pointer"
                    onClick={() => setLightbox(job.imageUrl!)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
