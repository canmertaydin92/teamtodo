import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [project, projects, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignees: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            project: { select: { id: true, name: true, color: true } },
            _count: { select: { comments: true } },
          },
          orderBy: [{ status: "asc" }, { deadline: "asc" }],
        },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, color: true } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, image: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const grouped = {
    TODO: project.tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: project.tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: project.tasks.filter((t) => t.status === "DONE"),
  };

  const sections = [
    { key: "TODO" as const, label: "Yapılacak", color: "text-yellow-400" },
    { key: "IN_PROGRESS" as const, label: "Devam Ediyor", color: "text-blue-400" },
    { key: "DONE" as const, label: "Tamamlandı", color: "text-green-400" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: project.color + "25" }}
        >
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-100">{project.name}</h1>
        <span className="text-sm text-gray-600 bg-gray-800 px-2 py-1 rounded-lg">{project.tasks.length} görev</span>
      </div>

      {isAdmin && <TaskForm projects={projects} users={users} />}

      <div className="mt-8 space-y-6">
        {sections.map(({ key, label, color }) =>
          grouped[key].length > 0 ? (
            <div key={key}>
              <h2 className={`text-xs font-semibold ${color} uppercase tracking-wider mb-2`}>
                {label} ({grouped[key].length})
              </h2>
              <div className="space-y-2">
                {grouped[key].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
