"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Project { id: string; name: string; color: string }
interface User { id: string; name?: string | null; email?: string | null; image?: string | null }

export function TaskForm({ projects, users }: { projects: Project[]; users: User[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    projectId: "",
    assigneeId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        deadline: form.deadline || null,
        projectId: form.projectId || null,
        assigneeId: form.assigneeId || null,
      }),
    });

    setForm({ title: "", description: "", deadline: "", projectId: "", assigneeId: "" });
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border border-dashed border-gray-300 hover:border-indigo-400 rounded-xl px-4 py-3 w-full transition-colors"
      >
        <span className="text-lg">+</span> Yeni görev ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-4 shadow-sm space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Görev başlığı"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full text-sm font-medium outline-none placeholder:text-gray-400"
        required
      />
      <textarea
        placeholder="Açıklama (isteğe bağlı)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full text-sm text-gray-600 outline-none resize-none placeholder:text-gray-400 min-h-[40px]"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
        />
        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
        >
          <option value="">Proje seç</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={form.assigneeId}
          onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
        >
          <option value="">Kişi ata</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>İptal</Button>
        <Button type="submit" size="sm" disabled={loading || !form.title.trim()}>
          {loading ? "Ekleniyor..." : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
