import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", heic: "image/heic",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (filename.includes("..") || filename.includes("/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);
    const data = await readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
