import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const projects = await prisma.project.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} user={session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
