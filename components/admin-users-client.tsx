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
  _count: { taskAssignments: number; comments: number };
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

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 text-sm">
        Henüz kayıtlı kullanıcı yok
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-gray-700 transition-colors"
        >
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-sm bg-gray-700 text-gray-300">{user.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-200 truncate">{user.name ?? "—"}</p>
              <Badge
                className={`text-xs px-1.5 py-0.5 border-0 font-medium flex-shrink-0 ${
                  user.role === "ADMIN"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {user.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
            <p className="text-xs text-gray-700 mt-1">
              {user._count.taskAssignments} görev · {user._count.comments} yorum
            </p>
          </div>

          <button
            onClick={() => toggleRole(user.id, user.role)}
            disabled={loading === user.id}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border flex-shrink-0 ${
              user.role === "ADMIN"
                ? "text-red-400 hover:bg-red-500/10 border-red-500/30"
                : "text-indigo-400 hover:bg-indigo-500/10 border-indigo-500/30"
            } disabled:opacity-40`}
          >
            {loading === user.id
              ? "..."
              : user.role === "ADMIN"
              ? "Düşür"
              : "Yönetici Yap"}
          </button>
        </div>
      ))}
    </div>
  );
}
