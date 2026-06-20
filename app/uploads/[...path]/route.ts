import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getDataDir } from "../../../lib/config";
import { requireAuth } from "../../../lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  await requireAuth();
  const resolvedParams = await params;
  const requested = path.join(...resolvedParams.path);
  const uploadsRoot = path.join(getDataDir(), "uploads");
  const absolute = path.resolve(uploadsRoot, requested);
  if (!absolute.startsWith(uploadsRoot) || !fs.existsSync(absolute)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const body = fs.readFileSync(absolute);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600"
    }
  });
}
