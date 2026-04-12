"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationButton() {
  const [status, setStatus] = useState<"checking" | "idle" | "subscribed" | "denied" | "unsupported">("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
        return;
      }
      if (Notification.permission === "granted") {
        await subscribe(reg);
        return;
      }
      setStatus("idle");
    }).catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe(reg?: ServiceWorkerRegistration) {
    try {
      const registration = reg ?? await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("subscribed");
    } catch {
      setStatus("denied");
    }
  }

  async function handleClick() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribe();
      } else {
        setStatus("denied");
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "unsupported" || status === "checking") return null;

  if (status === "subscribed") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
        <span>🔔</span>
        <span>Bildirimler açık</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600">
        <span>🔕</span>
        <span>Bildirimler engellendi</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors w-full text-left disabled:opacity-50"
    >
      <span>🔔</span>
      <span>{loading ? "Açılıyor..." : "Bildirimleri Aç"}</span>
    </button>
  );
}
