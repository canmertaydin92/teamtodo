"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RealtimeRefresh() {
  const router = useRouter();
  const retryDelay = useRef(1000);

  useEffect(() => {
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/events");

      es.onopen = () => {
        retryDelay.current = 1000; // bağlantı başarılıysa delay sıfırla
      };

      es.onmessage = () => {
        router.refresh();
      };

      es.onerror = () => {
        es.close();
        // Exponential backoff ile yeniden bağlan (max 30sn)
        retryTimer = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 2, 30000);
          connect();
        }, retryDelay.current);
      };
    }

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, [router]);

  return null;
}
