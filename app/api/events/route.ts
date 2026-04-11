import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import emitter from "@/lib/sse-emitter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // İlk bağlantı onayı
      controller.enqueue(encoder.encode(": connected\n\n"));

      const handler = () => {
        try {
          controller.enqueue(encoder.encode("data: refresh\n\n"));
        } catch {
          // bağlantı kopmuş
        }
      };

      emitter.on("update", handler);

      // Nginx proxy timeout'u engellemek için keep-alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 20000);

      // Bağlantı kapandığında temizle
      req.signal.addEventListener("abort", () => {
        emitter.off("update", handler);
        clearInterval(keepAlive);
        try { controller.close(); } catch { /* zaten kapalı */ }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Nginx proxy buffering'i kapat
    },
  });
}
