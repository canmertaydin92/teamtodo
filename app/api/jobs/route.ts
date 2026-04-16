import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, imageUrl } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Başlık zorunlu" }, { status: 400 });

  const job = await prisma.job.create({
    data: { title: title.trim(), description: description?.trim() || null, imageUrl: imageUrl || null, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(job);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (job.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
