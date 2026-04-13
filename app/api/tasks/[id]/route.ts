import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitUpdate } from "@/lib/sse-emitter";
import { sendPushToAll } from "@/lib/web-push";

const assigneeInclude = {
  assignees: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...assigneeInclude,
      project: { select: { id: true, name: true, color: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "USER") {
    const isAssigned = task.assignees.some((a) => a.userId === session.user.id);
    if (!isAssigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (session.user.role === "USER") {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { status: true, assignees: { select: { userId: true } } },
    });
    const isAssigned = task?.assignees.some((a) => a.userId === session.user.id);
    if (!isAssigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const oldStatus = task!.status;
    const updated = await prisma.task.update({
      where: { id },
      data: { status: body.status },
      include: {
        ...assigneeInclude,
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
    });

    if (body.status && body.status !== oldStatus) {
      await prisma.activityLog.create({
        data: {
          type: "STATUS_CHANGE",
          taskId: id,
          userId: session.user.id,
          meta: { from: oldStatus, to: body.status, taskTitle: updated.title },
        },
      });
      emitUpdate();
      const STATUS_TR: Record<string, string> = { TODO: "Yapılacak", IN_PROGRESS: "Devam Ediyor", DONE: "Tamamlandı" };
      sendPushToAll(
        { title: updated.title, body: `${session.user.name ?? "Biri"}: ${STATUS_TR[oldStatus]} → ${STATUS_TR[body.status]}` },
        session.user.id
      ).catch(() => {});
    } else {
      emitUpdate();
    }

    return NextResponse.json(updated);
  }

  // ADMIN
  const existing = await prisma.task.findUnique({ where: { id }, select: { status: true, title: true } });

  const assigneeIds: string[] | undefined = body.assigneeIds;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      ...(assigneeIds !== undefined && {
        assignees: {
          deleteMany: {},
          create: assigneeIds.map((userId) => ({ userId })),
        },
      }),
    },
    include: {
      ...assigneeInclude,
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  if (body.status && existing && body.status !== existing.status) {
    await prisma.activityLog.create({
      data: {
        type: "STATUS_CHANGE",
        taskId: id,
        userId: session.user.id,
        meta: { from: existing.status, to: body.status, taskTitle: task.title },
      },
    });
    const STATUS_TR: Record<string, string> = { TODO: "Yapılacak", IN_PROGRESS: "Devam Ediyor", DONE: "Tamamlandı" };
    sendPushToAll(
      { title: task.title, body: `${session.user.name ?? "Admin"}: ${STATUS_TR[existing.status]} → ${STATUS_TR[body.status]}` },
      session.user.id
    ).catch(() => {});
  }

  emitUpdate();
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  emitUpdate();
  return NextResponse.json({ ok: true });
}
