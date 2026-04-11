import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // USER: sadece kendine atanmış görevlerin projelerini görsün
  if (session.user.role === "USER") {
    const userTasks = await prisma.task.findMany({
      where: { assigneeId: session.user.id, projectId: { not: null } },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    const projectIds = userTasks.map((t) => t.projectId!);

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: { _count: { select: { tasks: { where: { assigneeId: session.user.id } } } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(projects);
  }

  // ADMIN: hepsini görsün
  const projects = await prisma.project.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const project = await prisma.project.create({
    data: { name: name.trim(), color: color ?? "#6366f1" },
  });
  return NextResponse.json(project, { status: 201 });
}
