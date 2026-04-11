import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, projects, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
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

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: project.color + "20" }}>
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <span className="text-sm text-gray-400">{project.tasks.length} görev</span>
      </div>

      <TaskForm projects={projects} users={users} />

      <div className="mt-8 space-y-6">
        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
          grouped[status].length > 0 && (
            <div key={status}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {status === "TODO" ? "Yapılacak" : status === "IN_PROGRESS" ? "Devam Ediyor" : "Tamamlandı"} ({grouped[status].length})
              </h2>
              <div className="space-y-2">
                {grouped[status].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
