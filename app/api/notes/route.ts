import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content, imageUrl } = await req.json();
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await prisma.note.create({
    data: {
      content: content?.trim() ?? "",
      imageUrl: imageUrl ?? null,
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
