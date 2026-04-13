"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PRIORITY_CONFIG, type Priority } from "@/lib/priority";

interface Project { id: string; name: string; color: string }
interface User { id: string; name?: string | null; email?: string | null; image?: string | null }

export function TaskForm({ projects, users }: { projects: Project[]; users: User[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    projectId: "",
    priority: "NORMAL" as Priority,
    assigneeIds: [] as string[],
  });

  function toggleUser(id: string) {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter((x) => x !== id)
        : [...f.assigneeIds, id],
    }));
  }

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
        assigneeIds: form.assigneeIds,
        priority: form.priority,
      }),
    });

    setForm({ title: "", description: "", deadline: "", projectId: "", priority: "NORMAL", assigneeIds: [] });
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  const selectedUsers = users.filter((u) => form.assigneeIds.includes(u.id));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 border border-dashed border-gray-700 hover:border-indigo-600 rounded-xl px-4 py-3 w-full transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        <span>Yeni görev ekle</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl space-y-4">

      {/* Başlık */}
      <div>
        <input
          autoFocus
          type="text"
          placeholder="Görev başlığı *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full text-base font-medium bg-transparent outline-none text-gray-100 placeholder:text-gray-600 border-b border-gray-800 pb-2"
          required
        />
      </div>

      {/* Açıklama */}
      <div>
        <textarea
          placeholder="Açıklama ekle..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full text-sm text-gray-400 bg-transparent outline-none resize-none placeholder:text-gray-700 min-h-[48px]"
          rows={2}
        />
      </div>

      {/* Öncelik */}
      <div>
        <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Öncelik</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setForm({ ...form, priority: p })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                form.priority === p
                  ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} ${PRIORITY_CONFIG[p].border}`
                  : "bg-gray-800 text-gray-500 border-transparent"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Son Tarih + Proje */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">Son Tarih</p>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wider">Proje</p>
          <select
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Seç...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kişi Atama */}
      <div>
        <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Atanan Kişiler</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserPicker((v) => !v)}
            className="flex items-center gap-2 w-full text-left bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-gray-600 transition-colors"
          >
            {selectedUsers.length === 0 ? (
              <span className="text-gray-600">Kişi seç...</span>
            ) : (
              <>
                <div className="flex -space-x-1.5">
                  {selectedUsers.slice(0, 4).map((u) => (
                    <Avatar key={u.id} className="w-5 h-5 border border-gray-700">
                      <AvatarImage src={u.image ?? ""} />
                      <AvatarFallback className="text-[8px] bg-indigo-700 text-white">{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-gray-300">{selectedUsers.map((u) => u.name).join(", ")}</span>
              </>
            )}
            <span className="ml-auto text-gray-600">▾</span>
          </button>

          {showUserPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              {users.map((u) => {
                const selected = form.assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-600"}`}>
                      {selected && <span className="text-white text-[9px] leading-none">✓</span>}
                    </div>
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={u.image ?? ""} />
                      <AvatarFallback className="text-[9px] bg-gray-600 text-gray-300">{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300 truncate">{u.name ?? u.email}</span>
                  </button>
                );
              })}
              <div className="border-t border-gray-700 mt-1 pt-1 px-3 pb-1.5">
                <button type="button" onClick={() => setShowUserPicker(false)} className="text-xs text-indigo-400">
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="flex-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800">
          İptal
        </Button>
        <Button type="submit" size="sm" disabled={loading || !form.title.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
          {loading ? "Ekleniyor..." : "Görevi Ekle"}
        </Button>
      </div>
    </form>
  );
}
