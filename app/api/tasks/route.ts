import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitUpdate } from "@/lib/sse-emitter";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const today = searchParams.get("today");

  const where: Record<string, unknown> = {};

  // USER sadece kendine atanan görevleri görebilir
  if (session.user.role === "USER") {
    where.assigneeId = session.user.id;
  } else {
    if (assigneeId) where.assigneeId = assigneeId;
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
      assignee: { select: { id: true, name: true, email: true, image: true } },
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

  const { title, description, status, deadline, projectId, assigneeId } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description ?? null,
      status: status ?? "TODO",
      deadline: deadline ? new Date(deadline) : null,
      projectId: projectId ?? null,
      assigneeId: assigneeId ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, image: true } },
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  emitUpdate();
  return NextResponse.json(task, { status: 201 });
}
