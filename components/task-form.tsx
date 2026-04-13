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

  const inputClass = "text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-indigo-500";
  const selectedUsers = users.filter((u) => form.assigneeIds.includes(u.id));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-400 border border-dashed border-gray-700 hover:border-indigo-600 rounded-xl px-4 py-3 w-full transition-colors"
      >
        <span className="text-lg">+</span> Yeni görev ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/30 rounded-xl p-4 shadow-lg space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Görev başlığı"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full text-sm font-medium bg-transparent outline-none text-gray-100 placeholder:text-gray-600"
        required
      />
      <textarea
        placeholder="Açıklama (isteğe bağlı)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full text-sm text-gray-400 bg-transparent outline-none resize-none placeholder:text-gray-700 min-h-[40px]"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          className={inputClass}
        />
        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          className={inputClass}
        >
          <option value="">Proje seç</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          className={`${inputClass} ${PRIORITY_CONFIG[form.priority].color}`}
        >
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
          ))}
        </select>

        {/* Çoklu kişi seçici */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserPicker((v) => !v)}
            className={`${inputClass} flex items-center gap-1.5`}
          >
            {selectedUsers.length === 0 ? (
              <span>Kişi ata</span>
            ) : (
              <>
                <div className="flex -space-x-1">
                  {selectedUsers.slice(0, 3).map((u) => (
                    <Avatar key={u.id} className="w-4 h-4 border border-gray-700">
                      <AvatarImage src={u.image ?? ""} />
                      <AvatarFallback className="text-[8px] bg-indigo-700 text-white">{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>{selectedUsers.length} kişi</span>
              </>
            )}
          </button>

          {showUserPicker && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[180px] py-1">
              {users.map((u) => {
                const selected = form.assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-600"}`}>
                      {selected && <span className="text-white text-[9px] leading-none">✓</span>}
                    </div>
                    <Avatar className="w-5 h-5 flex-shrink-0">
                      <AvatarImage src={u.image ?? ""} />
                      <AvatarFallback className="text-[9px] bg-gray-600 text-gray-300">{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-300 truncate">{u.name ?? u.email}</span>
                  </button>
                );
              })}
              <div className="border-t border-gray-700 mt-1 pt-1 px-3 pb-1">
                <button
                  type="button"
                  onClick={() => setShowUserPicker(false)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 hover:bg-gray-800">İptal</Button>
        <Button type="submit" size="sm" disabled={loading || !form.title.trim()} className="bg-indigo-600 hover:bg-indigo-500">
          {loading ? "Ekleniyor..." : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
