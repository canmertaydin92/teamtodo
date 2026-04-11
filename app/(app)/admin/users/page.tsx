import { requireAdmin } from "@/lib/auth-helpers";
import { AdminUsersClient } from "@/components/admin-users-client";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: { select: { assignedTasks: true, comments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sisteme kayıtlı kullanıcıların rollerini buradan yönetebilirsin.
        </p>
      </div>
      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
