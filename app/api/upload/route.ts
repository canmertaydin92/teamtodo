import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
  if (!allowed.includes(ext)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  if (buffer.length > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const uploadDir = join(process.cwd(), "public", "uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch {
    // klasör zaten varsa devam et
  }

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
