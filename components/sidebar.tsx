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
    { href: "/tasks", label: isAdmin ? "Tüm Görevler" : "Görevlerim", icon: "✅" },
    ...(isAdmin ? [{ href: "/team", label: "Ekip", icon: "👥" }] : []),
  ];

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <span className="font-semibold text-gray-900">TeamTodo</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === link.href
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}

        {/* Projeler — ADMIN hepsini görür, USER sadece kendi atananları */}
        {projects.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Projeler
              </span>
              {isAdmin && (
                <Link href="/projects" className="text-xs text-indigo-600 hover:underline">
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
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
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

        {/* Admin paneli — sadece ADMIN görsün */}
        {isAdmin && (
          <div className="pt-4">
            <div className="px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Yönetim
              </span>
            </div>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === "/admin/users"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span>⚙️</span>
              Kullanıcı Yönetimi
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs">{user.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
              {isAdmin && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-1 rounded font-medium flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-gray-400 hover:text-gray-600 text-xs"
            title="Çıkış"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
