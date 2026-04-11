"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export function ProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    setName("");
    setColor(COLORS[0]);
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-400 border border-dashed border-gray-700 hover:border-indigo-600 rounded-xl px-4 py-3 w-full transition-colors"
      >
        <span className="text-lg">+</span> Yeni proje ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/30 rounded-xl p-4 shadow-lg space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Proje adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full text-sm font-medium bg-transparent outline-none text-gray-100 placeholder:text-gray-600"
        required
      />
      <div className="flex gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-offset-gray-900 ring-gray-400" : "opacity-70 hover:opacity-100"}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 hover:bg-gray-800">İptal</Button>
        <Button type="submit" size="sm" disabled={loading || !name.trim()} className="bg-indigo-600 hover:bg-indigo-500">
          {loading ? "Oluşturuluyor..." : "Oluştur"}
        </Button>
      </div>
    </form>
  );
}
