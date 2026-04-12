"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface SidebarProps {
  projects: Project[];
  user: User;
}

export function Sidebar({ projects, user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const navLinks = [
    { href: "/dashboard", label: "Bugün", icon: "📋" },
    { href: "/board", label: isAdmin ? "Ekip Tahtası" : "Görev Tahtam", icon: "🗂️" },
    { href: "/tasks", label: isAdmin ? "Tüm Görevler" : "Görevlerim", icon: "✅" },
    ...(isAdmin ? [{ href: "/team", label: "Ekip", icon: "👥" }] : []),
  ];

  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <span className="font-semibold text-gray-100">TeamTodo</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === link.href
                ? "bg-indigo-500/15 text-indigo-400 font-medium"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            )}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}

        {projects.length > 0 && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Projeler
              </span>
              {isAdmin && (
                <Link href="/projects" className="text-xs text-indigo-500 hover:text-indigo-400">
                  + Yeni
                </Link>
              )}
            </div>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === `/projects/${project.id}`
                    ? "bg-indigo-500/15 text-indigo-400 font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </Link>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="pt-5">
            <div className="px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Yönetim
              </span>
            </div>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === "/admin/users"
                  ? "bg-indigo-500/15 text-indigo-400 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <span>⚙️</span>
              Kullanıcı Yönetimi
            </Link>
            <Link
              href="/admin/activity"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === "/admin/activity"
                  ? "bg-indigo-500/15 text-indigo-400 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <span>📊</span>
              Aktivite Günlüğü
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{user.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-gray-200 truncate">{user.name}</p>
              {isAdmin && (
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1 rounded font-medium flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            title="Çıkış"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
