/**
 * Geração de imagem de capa para matérias.
 * Prioridade: Codex CLI local (`codex exec`, ferramenta image_gen embutida,
 * já autenticada no srv1 — sem API key). Fallback: banco de imagens Pexels.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { readdir, stat, readFile, mkdtemp } from "fs/promises";
import path from "path";
import os from "os";
import { saveUploadBuffer } from "@/lib/uploads";

const execFileAsync = promisify(execFile);

const CODEX_IMAGES_DIR = path.join(os.homedir(), ".codex", "generated_images");
const CODEX_TIMEOUT_MS = 120_000; // geração de imagem pode levar 1-2min+
// O processo do Next em produção (subido via WMI) não herda o PATH interativo
// do usuário, então o binário "codex" não é resolvido por nome — precisa do
// caminho absoluto, configurável via env para funcionar em qualquer host.
const CODEX_BIN = process.env.CODEX_BIN_PATH || "codex";

async function listPngsRecursive(dir: string): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listPngsRecursive(full);
      for (const [file, mtime] of nested) result.set(file, mtime);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const s = await stat(full);
      result.set(full, s.mtimeMs);
    }
  }
  return result;
}

/** Gera a imagem de capa via Codex CLI local. Retorna a URL pública salva em /uploads, ou null se falhar. */
export async function generateCoverImage(prompt: string): Promise<string | null> {
  try {
    const before = await listPngsRecursive(CODEX_IMAGES_DIR);

    const fullPrompt = `Generate an image: fotografia jornalística realista, sem texto sobreposto, formato paisagem, sobre: ${prompt}. Save the PNG.`;

    // cwd isolado: evita que o Codex tente escrever/ler no repo do portal.
    const cwd = await mkdtemp(path.join(os.tmpdir(), "codex-cover-"));

    await execFileAsync(CODEX_BIN, ["exec", "--skip-git-repo-check", fullPrompt], {
      cwd,
      timeout: CODEX_TIMEOUT_MS,
      windowsHide: true,
    });

    const after = await listPngsRecursive(CODEX_IMAGES_DIR);
    const newFiles = [...after.entries()].filter(([file]) => !before.has(file));

    if (newFiles.length === 0) return null;
    newFiles.sort((a, b) => b[1] - a[1]); // mais recente primeiro
    const [chosenPath] = newFiles[0];

    const buffer = await readFile(chosenPath);
    return await saveUploadBuffer(buffer, "capa-materia.png");
  } catch (e) {
    console.error("Falha ao gerar imagem via Codex CLI:", e instanceof Error ? e.message : e);
    return null;
  }
}

export function pexelsConfigured(): boolean {
  return Boolean(process.env.PEXELS_API_KEY);
}

/** Busca uma imagem livre de direitos no Pexels como fallback. Retorna a URL pública salva em /uploads, ou null. */
export async function fetchStockImageFallback(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const searchRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const photoUrl: string | undefined = searchData.photos?.[0]?.src?.large;
    if (!photoUrl) return null;

    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return await saveUploadBuffer(buffer, "capa-pexels.jpg");
  } catch (e) {
    console.error("Falha ao buscar imagem no Pexels:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Ordem de tentativa: Codex CLI (IA) -> Pexels (fallback) -> null (sem imagem). */
export async function generateOrFetchCoverImage(prompt: string): Promise<string | null> {
  const generated = await generateCoverImage(prompt);
  if (generated) return generated;
  return fetchStockImageFallback(prompt);
}
