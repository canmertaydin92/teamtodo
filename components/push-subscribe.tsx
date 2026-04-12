"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscribe() {
  const [status, setStatus] = useState<"checking" | "idle" | "subscribed" | "denied" | "unsupported">("checking");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    // Kontrol tamamlanmadan banner gösterme
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
        return;
      }

      // Daha önce izin verilmişse otomatik abone ol, banner gösterme
      if (Notification.permission === "granted") {
        await subscribe(reg);
        return;
      }

      // Henüz izin verilmemiş → banner göster
      setStatus("idle");
    }).catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe(reg?: ServiceWorkerRegistration) {
    try {
      const registration = reg ?? await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
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

  async function requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribe();
    } else {
      setStatus("denied");
    }
  }

  if (status === "checking" || status === "unsupported" || status === "subscribed" || status === "denied") return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
          🔔
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100">Bildirimler</p>
          <p className="text-xs text-gray-500">Görev değişikliklerinden haberdar ol</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={requestPermission}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Aç
          </button>
          <button
            onClick={() => setStatus("denied")}
            className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1.5 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
