import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { slugify } from "@/lib/utils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Salva um buffer em public/uploads com nome único e retorna a URL pública (/uploads/arquivo). */
export async function saveUploadBuffer(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName) || ".jpg";
  const base = slugify(path.basename(originalName, ext)) || "imagem";
  const filename = `${Date.now()}-${base}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
