import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";

export default async function TasksPage() {
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
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({ select: { id: true, name: true, color: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, image: true }, orderBy: { name: "asc" } }),
  ]);

  const grouped = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  const sections = [
    { key: "TODO", label: "Yapılacak", color: "text-yellow-400" },
    { key: "IN_PROGRESS", label: "Devam Ediyor", color: "text-blue-400" },
    { key: "DONE", label: "Tamamlandı", color: "text-green-400" },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">
          {isAdmin ? "Tüm Görevler" : "Görevlerim"}
        </h1>
      </div>

      {isAdmin && <TaskForm projects={projects} users={users} />}

      <div className="mt-8 space-y-8">
        {sections.map(({ key, label, color }) => (
          <div key={key}>
            <h2 className={`text-sm font-semibold ${color} mb-2`}>
              {label} ({grouped[key].length})
            </h2>
            {grouped[key].length === 0 ? (
              <p className="text-sm text-gray-700 italic px-2">Görev yok</p>
            ) : (
              <div className="space-y-2">
                {grouped[key].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
