import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobsClient } from "@/components/jobs-client";

export default async function IslerPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [jobs, users] = await Promise.all([
    prisma.job.findMany({
      include: {
        author: { select: { id: true, name: true, image: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">İşler</h1>
        <p className="text-sm text-gray-500 mt-1">Yapılan ve devam eden işlerin kaydı</p>
      </div>
      <JobsClient
        initialJobs={jobs as any}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
        users={users}
      />
    </div>
  );
}
