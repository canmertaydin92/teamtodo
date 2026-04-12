"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

interface Project { id: string; name: string; color: string }
interface User { name?: string | null; email?: string | null; image?: string | null; role?: string }

export function AppShell({
  projects,
  user,
  children,
}: {
  projects: Project[];
  user: User;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince sidebar'ı kapat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Mobil overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — masaüstünde statik, mobilde slide-in overlay */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-30
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar projects={projects} user={user} />
      </div>

      {/* Sağ içerik */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobil üst bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            onClick={() => setOpen(true)}
            className="text-gray-400 hover:text-gray-200 p-1 -ml-1"
            aria-label="Menüyü aç"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-gray-100 text-sm">Aras Bilişim</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
