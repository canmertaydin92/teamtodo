import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitUpdate } from "@/lib/sse-emitter";
import { sendPushToAll } from "@/lib/web-push";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const { content, imageUrl } = await req.json();
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true } });

  const comment = await prisma.comment.create({
    data: {
      content: content?.trim() ?? "",
      imageUrl: imageUrl ?? null,
      taskId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "COMMENT",
      taskId,
      userId: session.user.id,
      meta: { content: content.trim().slice(0, 100), taskTitle: task?.title ?? "" },
    },
  });

  emitUpdate();

  sendPushToAll(
    { title: task?.title ?? "Görev", body: `${session.user.name ?? "Biri"}: ${content.trim().slice(0, 80)}` },
    session.user.id
  ).catch(() => {});

  return NextResponse.json(comment, { status: 201 });
}
