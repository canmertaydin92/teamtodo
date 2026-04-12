import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  "mailto:admin@arasbilisim.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
}

export async function sendPushToAll(payload: NotificationPayload, excludeUserId?: string) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: excludeUserId ? { userId: { not: excludeUserId } } : {},
  });

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data
      ).catch(async (err) => {
        // Geçersiz subscription → sil
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        throw err;
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) console.warn(`Push: ${results.length - failed} başarılı, ${failed} başarısız`);
}

export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      })
    )
  );
}
