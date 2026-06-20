import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { getDataDir, NORMALIZATION_VERSION } from "./config";

export const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ensureDataDirs() {
  const dataDir = getDataDir();
  const originalsDir = path.join(dataDir, "uploads", "originals");
  const normalizedDir = path.join(dataDir, "uploads", "normalized");
  fs.mkdirSync(originalsDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });
  return { dataDir, originalsDir, normalizedDir };
}

export function publicImagePath(absolutePath: string) {
  const dataDir = getDataDir();
  const relative = path.relative(path.join(dataDir, "uploads"), absolutePath);
  return `/uploads/${relative.split(path.sep).join("/")}`;
}

export async function storeAndNormalizeImage(file: File) {
  const { originalsDir, normalizedDir } = ensureDataDirs();
  const id = crypto.randomUUID();
  const extension = extensionForMimeType(file.type);
  const originalPath = path.join(originalsDir, `${id}.${extension}`);
  const normalizedPath = path.join(normalizedDir, `${id}.jpg`);
  const bytes = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(originalPath, bytes);

  await sharp(bytes)
    .rotate()
    .resize({
      width: 2500,
      height: 2500,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 92 })
    .toFile(normalizedPath);

  return {
    originalPath,
    normalizedPath,
    normalizationVersion: NORMALIZATION_VERSION
  };
}

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

