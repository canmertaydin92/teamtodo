import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskCard } from "@/components/task-card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const userFilter = isAdmin ? {} : { assigneeId: userId };

  const [todayTasks, overdueTasks, allStats] = await Promise.all([
    prisma.task.findMany({
      where: { ...userFilter, deadline: { gte: today, lt: tomorrow } },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { status: "asc" },
    }),
    prisma.task.findMany({
      where: { ...userFilter, deadline: { lt: today }, status: { not: "DONE" } },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    prisma.task.groupBy({ by: ["status"], where: userFilter, _count: true }),
  ]);

  const stats = {
    todo: allStats.find((s) => s.status === "TODO")?._count ?? 0,
    inProgress: allStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0,
    done: allStats.find((s) => s.status === "DONE")?._count ?? 0,
  };

  const dateStr = today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Bugün</h1>
        <p className="text-gray-500 text-sm capitalize">{dateStr}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{stats.todo}</p>
          <p className="text-sm font-medium text-yellow-500/70">Yapılacak</p>
        </div>
        <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          <p className="text-sm font-medium text-blue-500/70">Devam Eden</p>
        </div>
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{stats.done}</p>
          <p className="text-sm font-medium text-green-500/70">Tamamlanan</p>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-400 mb-2">⚠ Gecikmiş ({overdueTasks.length})</h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400">Bugünkü Görevler ({todayTasks.length})</h2>
          {isAdmin && (
            <Link href="/tasks?new=1" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              + Görev Ekle
            </Link>
          )}
        </div>
        {todayTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-700">
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
