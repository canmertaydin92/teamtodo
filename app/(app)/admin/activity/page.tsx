import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_LABELS: Record<string, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam Ediyor",
  DONE: "Tamamlandı",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-yellow-500/15 text-yellow-400",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400",
  DONE: "bg-green-500/15 text-green-400",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ActivityPage() {
  await requireAdmin();

  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Aktivite Günlüğü</h1>
        <p className="text-sm text-gray-500 mt-1">Ekip üyelerinin son hareketleri</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-gray-700">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Henüz aktivite yok</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {logs.map((log, i) => {
            const meta = log.meta as Record<string, string>;
            const isStatus = log.type === "STATUS_CHANGE";
            const isComment = log.type === "COMMENT";
            const showDate =
              i === 0 ||
              new Date(logs[i - 1].createdAt).toDateString() !== new Date(log.createdAt).toDateString();

            return (
              <div key={log.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-xs font-medium text-gray-600">
                      {new Date(log.createdAt).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>
                )}

                <div className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 transition-colors">
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                    <AvatarImage src={log.user.image ?? ""} />
                    <AvatarFallback className="text-xs bg-gray-700 text-gray-300">{log.user.name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-200">{log.user.name}</span>

                      {isStatus && (
                        <>
                          <span className="text-sm text-gray-500">durumu değiştirdi</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[meta.from] ?? "bg-gray-700 text-gray-400"}`}>
                            {STATUS_LABELS[meta.from] ?? meta.from}
                          </span>
                          <span className="text-gray-600 text-xs">→</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[meta.to] ?? "bg-gray-700 text-gray-400"}`}>
                            {STATUS_LABELS[meta.to] ?? meta.to}
                          </span>
                        </>
                      )}

                      {isComment && (
                        <span className="text-sm text-gray-500">yorum yaptı</span>
                      )}
                    </div>

                    <p className="text-xs text-indigo-400 font-medium mt-0.5 truncate">
                      📌 {log.task?.title ?? meta.taskTitle}
                    </p>

                    {isComment && meta.content && (
                      <p className="text-sm text-gray-500 mt-1.5 bg-gray-800 rounded-lg px-3 py-2 italic border border-gray-700">
                        &ldquo;{meta.content}{meta.content.length >= 100 ? "…" : ""}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-xs text-gray-600 flex-shrink-0 mt-1">
                    {timeAgo(new Date(log.createdAt))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
