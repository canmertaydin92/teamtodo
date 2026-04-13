import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitUpdate } from "@/lib/sse-emitter";
import { sendPushToAll, sendPushToUser } from "@/lib/web-push";

const assigneeInclude = {
  assignees: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const today = searchParams.get("today");

  const where: Record<string, unknown> = {};

  if (session.user.role === "USER") {
    where.assignees = { some: { userId: session.user.id } };
  } else {
    if (assigneeId) where.assignees = { some: { userId: assigneeId } };
  }

  if (projectId) where.projectId = projectId;

  if (today === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.deadline = { gte: start, lte: end };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      ...assigneeInclude,
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, status, priority, deadline, projectId, assigneeIds } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const ids: string[] = Array.isArray(assigneeIds) ? assigneeIds : [];

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description ?? null,
      status: status ?? "TODO",
      priority: priority ?? "NORMAL",
      deadline: deadline ? new Date(deadline) : null,
      projectId: projectId ?? null,
      assignees: ids.length > 0 ? { create: ids.map((userId) => ({ userId })) } : undefined,
    },
    include: {
      ...assigneeInclude,
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  emitUpdate();

  const creator = session.user;
  if (ids.length === 1 && ids[0] !== creator.id) {
    sendPushToUser(ids[0], { title: task.title, body: `${creator.name ?? "Biri"} sana yeni bir görev atadı` }).catch(() => {});
  } else if (ids.length > 1) {
    ids.filter((id) => id !== creator.id).forEach((uid) => {
      sendPushToUser(uid, { title: task.title, body: `${creator.name ?? "Biri"} sana yeni bir görev atadı` }).catch(() => {});
    });
  } else {
    sendPushToAll({ title: "Yeni görev eklendi", body: task.title }, creator.id).catch(() => {});
  }

  return NextResponse.json(task, { status: 201 });
}
