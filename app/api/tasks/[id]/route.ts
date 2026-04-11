import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true, image: true } },
      project: { select: { id: true, name: true, color: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // USER sadece kendi görevine erişebilir
  if (session.user.role === "USER" && task.assigneeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // USER sadece kendi görevinin statusunu değiştirebilir
  if (session.user.role === "USER") {
    const task = await prisma.task.findUnique({ where: { id }, select: { assigneeId: true } });
    if (task?.assigneeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // USER sadece status değiştirebilir
    const allowedFields = { status: body.status };
    const updated = await prisma.task.update({
      where: { id },
      data: allowedFields,
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // ADMIN her şeyi değiştirebilir
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, image: true } },
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
