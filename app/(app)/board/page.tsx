import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskForm } from "@/components/task-form";

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  const taskFilter = isAdmin ? {} : { assigneeId: userId };

  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      where: taskFilter,
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({ select: { id: true, name: true, color: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, image: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            {isAdmin ? "Ekip Tahtası" : "Görev Tahtam"}
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {isAdmin
              ? `${tasks.length} görev — sürükleyerek durumu değiştir`
              : `${tasks.length} görev atandı — sürükleyerek durumu değiştir`}
          </p>
        </div>
        {isAdmin && <TaskForm projects={projects} users={users} />}
      </div>

      <div className="flex-1 overflow-auto pb-6">
        <KanbanBoard tasks={tasks} showAssignee={isAdmin} />
      </div>
    </div>
  );
}
