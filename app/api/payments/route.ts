import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const payments = await prisma.payment.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { title, date, expense, income } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "İş adı zorunlu" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "Tarih zorunlu" }, { status: 400 });

  const payment = await prisma.payment.create({
    data: {
      title: title.trim(),
      date: new Date(date),
      expense: parseFloat(expense) || 0,
      income: parseFloat(income) || 0,
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(payment);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
