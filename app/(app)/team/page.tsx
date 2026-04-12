import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskCard } from "@/components/task-card";

export default async function TeamPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      assignedTasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true, image: true } },
          project: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: true } },
        },
        where: { status: { not: "DONE" } },
        orderBy: [{ status: "asc" }, { deadline: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Ekip</h1>

      <div className="space-y-8">
        {users.map((user) => (
          <div key={user.id}>
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.image ?? ""} />
                <AvatarFallback className="bg-gray-700 text-gray-300">{user.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-200">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-lg">
                {user.assignedTasks.length} aktif görev
              </span>
            </div>

            {user.assignedTasks.length === 0 ? (
              <p className="text-sm text-gray-700 italic px-2 pb-2">Aktif görev yok</p>
            ) : (
              <div className="space-y-2">
                {user.assignedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-gray-600 py-12">Henüz giriş yapan kullanıcı yok</p>
        )}
      </div>
    </div>
  );
}
