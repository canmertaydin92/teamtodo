"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
  _count: { assignedTasks: number; comments: number };
}

export function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleRole(userId: string, currentRole: "ADMIN" | "USER") {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    setLoading(userId);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });

    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u))
      );
    }
    setLoading(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-5">Kullanıcı</div>
        <div className="col-span-2 text-center">Görev</div>
        <div className="col-span-2 text-center">Yorum</div>
        <div className="col-span-2 text-center">Rol</div>
        <div className="col-span-1"></div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Henüz kayıtlı kullanıcı yok
        </div>
      )}

      {users.map((user) => (
        <div
          key={user.id}
          className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50 transition-colors"
        >
          <div className="col-span-5 flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="text-sm">{user.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name ?? "—"}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="col-span-2 text-center">
            <span className="text-sm font-medium text-gray-700">{user._count.assignedTasks}</span>
          </div>

          <div className="col-span-2 text-center">
            <span className="text-sm font-medium text-gray-700">{user._count.comments}</span>
          </div>

          <div className="col-span-2 flex justify-center">
            <Badge
              className={`text-xs px-2 py-0.5 border-0 font-medium ${
                user.role === "ADMIN"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
            </Badge>
          </div>

          <div className="col-span-1 flex justify-end">
            <button
              onClick={() => toggleRole(user.id, user.role)}
              disabled={loading === user.id}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                user.role === "ADMIN"
                  ? "text-red-600 hover:bg-red-50 border border-red-200"
                  : "text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
              } disabled:opacity-40`}
            >
              {loading === user.id
                ? "..."
                : user.role === "ADMIN"
                ? "Düşür"
                : "Yönetici Yap"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
