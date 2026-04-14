import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("[upload] No file in request");
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    console.log(`[upload] file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.name.split(".").pop()?.toLowerCase() ?? "jpg").replace("heif", "heic");
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
    if (!allowed.includes(ext)) {
      console.error(`[upload] Invalid type: ${ext}`);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
    console.log(`[upload] uploadDir: ${uploadDir}`);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    console.log(`[upload] saved: ${filepath}`);
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (err) {
    console.error("[upload] ERROR:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
