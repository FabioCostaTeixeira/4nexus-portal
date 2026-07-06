"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostStatus, SourceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";
import { slugify, readingTimeMinutes } from "@/lib/utils";
import { generateDraft, reviewText } from "@/lib/ai";

export type SaveState = { message: string; error: boolean };

const ALL_STATUSES: PostStatus[] = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED", "REJECTED"];

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "noticia";
  let i = 1;
  while (
    await prisma.post.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
  return slug;
}

export async function savePost(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);

  const id = String(formData.get("id") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const authorId = String(formData.get("authorId") || "");
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
  const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
  const featured = formData.get("featured") === "on";
  const generatedByAi = formData.get("generatedByAi") === "true";
  let status = String(formData.get("status") || "DRAFT") as PostStatus;
  const tagIds = formData.getAll("tags").map(String);

  if (!title || !content || !categoryId || !authorId) {
    return { message: "Preencha título, conteúdo, categoria e autor.", error: true };
  }
  if (!ALL_STATUSES.includes(status)) status = "DRAFT";

  // Regras de papel
  if (session.role === "REDATOR") {
    // Redator não publica, não arquiva, não rejeita
    if (!["DRAFT", "PENDING"].includes(status)) status = "PENDING";
  }
  // Conteúdo gerado por IA nunca publica sem validação de editor/admin
  if (generatedByAi && status === "PUBLISHED" && !can.publishPosts(session.role)) {
    status = "PENDING";
  }

  let existing = null;
  if (id) {
    existing = await prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!existing) return { message: "Notícia não encontrada.", error: true };
    if (session.role === "REDATOR" && existing.author.userId !== session.id) {
      return { message: "Você só pode editar notícias próprias.", error: true };
    }
  }

  const slug = await uniqueSlug(slugInput || title, id ?? undefined);
  const publishing = status === "PUBLISHED";

  const data = {
    title,
    slug,
    summary: summary || null,
    content,
    categoryId,
    authorId,
    coverImageUrl,
    metaTitle,
    metaDescription,
    featured,
    status,
    generatedByAi,
    sourceType: (generatedByAi ? "AI_ASSISTED" : "HUMAN") as SourceType,
    readingTime: readingTimeMinutes(content),
    ...(publishing
      ? {
          publishedAt: existing?.publishedAt ?? new Date(),
          approvedById: session.id,
        }
      : {}),
  };

  let postId = id;
  if (id) {
    await prisma.post.update({
      where: { id },
      data: {
        ...data,
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  } else {
    const created = await prisma.post.create({
      data: {
        ...data,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    postId = created.id;
  }

  revalidatePath("/", "layout");
  redirect(`/admin/noticias/${postId}/editar?salvo=1`);
}

export async function changePostStatus(
  postId: string,
  newStatusInput: string
): Promise<{ ok: boolean; message: string }> {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  const newStatus = newStatusInput as PostStatus;
  if (!ALL_STATUSES.includes(newStatus)) {
    return { ok: false, message: "Status inválido." };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });
  if (!post) return { ok: false, message: "Notícia não encontrada." };

  if (session.role === "REDATOR") {
    if (post.author.userId !== session.id) {
      return { ok: false, message: "Você só pode alterar notícias próprias." };
    }
    if (!["DRAFT", "PENDING"].includes(newStatus)) {
      return { ok: false, message: "Redator só pode salvar rascunho ou enviar para aprovação." };
    }
  }
  if (["PUBLISHED", "REJECTED", "ARCHIVED"].includes(newStatus) && !can.approvePosts(session.role)) {
    return { ok: false, message: "Sem permissão para esta transição." };
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: newStatus,
      ...(newStatus === "PUBLISHED"
        ? { publishedAt: post.publishedAt ?? new Date(), approvedById: session.id }
        : {}),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/noticias");
  return { ok: true, message: "Status atualizado." };
}

export type AiResult =
  | { ok: true; title: string; summary: string; content: string; tags: string[]; metaDescription: string }
  | { ok: false; error: string };

export async function aiGenerateDraft(pauta: string): Promise<AiResult> {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  if (!pauta.trim()) return { ok: false, error: "Informe a pauta." };
  try {
    const draft = await generateDraft(pauta.trim());
    await prisma.aiDraft.create({
      data: {
        prompt: pauta.trim(),
        generatedTitle: draft.title,
        generatedContent: draft.content,
        generatedSummary: draft.summary,
        generatedTags: draft.tags.join(", "),
        generatedMetaDescription: draft.metaDescription,
        status: "GENERATED",
        reviewedById: session.id,
      },
    });
    return { ok: true, ...draft };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao gerar rascunho." };
  }
}

export async function aiReviewContent(texto: string): Promise<{ ok: boolean; content?: string; error?: string }> {
  await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  if (!texto.trim()) return { ok: false, error: "Não há texto para revisar." };
  try {
    const revised = await reviewText(texto);
    return { ok: true, content: revised };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao revisar texto." };
  }
}
