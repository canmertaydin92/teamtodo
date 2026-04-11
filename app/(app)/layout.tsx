import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const isAdmin = session.user.role === "ADMIN";

  let projects;
  if (isAdmin) {
    projects = await prisma.project.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: "asc" },
    });
  } else {
    const userTasks = await prisma.task.findMany({
      where: { assigneeId: session.user.id, projectId: { not: null } },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    const projectIds = userTasks.map((t) => t.projectId!);
    projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: "asc" },
    });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} user={session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
