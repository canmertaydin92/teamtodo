import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProjectForm } from "@/components/project-form";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projeler</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: project.color + "20" }}>
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{project.name}</p>
              <p className="text-xs text-gray-400">{project._count.tasks} görev</p>
            </div>
          </Link>
        ))}
      </div>

      <ProjectForm />
    </div>
  );
}
