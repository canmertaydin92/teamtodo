import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskCard } from "@/components/task-card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTasks, overdueTasks, allStats] = await Promise.all([
    prisma.task.findMany({
      where: { deadline: { gte: today, lt: tomorrow } },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { status: "asc" },
    }),
    prisma.task.findMany({
      where: { deadline: { lt: today }, status: { not: "DONE" } },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
  ]);

  const stats = {
    todo: allStats.find((s) => s.status === "TODO")?._count ?? 0,
    inProgress: allStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0,
    done: allStats.find((s) => s.status === "DONE")?._count ?? 0,
  };

  const dateStr = today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bugün</h1>
        <p className="text-gray-500 text-sm capitalize">{dateStr}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Yapılacak", value: stats.todo, color: "text-yellow-600 bg-yellow-50" },
          { label: "Devam Eden", value: stats.inProgress, color: "text-blue-600 bg-blue-50" },
          { label: "Tamamlanan", value: stats.done, color: "text-green-600 bg-green-50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2">⚠ Gecikmiş ({overdueTasks.length})</h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Bugünkü Görevler ({todayTasks.length})</h2>
          <Link href="/tasks?new=1" className="text-xs text-indigo-600 hover:underline">+ Görev Ekle</Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm">Bugün için görev yok!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
