import type { PostStatus, SourceType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { can } from "@/lib/auth";
import { slugify, readingTimeMinutes } from "@/lib/utils";

export type PostActor = { id: string; role: UserRole };

export const ALL_STATUSES: PostStatus[] = [
  "DRAFT",
  "PENDING",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
];

/** Aplica as regras de autorização de status na criação/edição de um post. */
export function resolveStatusForCreate(
  actor: PostActor,
  requestedStatus: PostStatus,
  generatedByAi: boolean
): PostStatus {
  let status = requestedStatus;
  // Redator não publica, não arquiva, não rejeita, não agenda.
  if (actor.role === "REDATOR") {
    if (!["DRAFT", "PENDING"].includes(status)) status = "PENDING";
  }
  // Conteúdo gerado por IA nunca publica sem validação de editor/admin.
  if (generatedByAi && status === "PUBLISHED" && !can.publishPosts(actor.role)) {
    status = "PENDING";
  }
  return status;
}

export async function uniqueSlug(base: string, excludeId?: string) {
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

export type CreatePostInput = {
  actor: PostActor;
  title: string;
  content: string;
  summary?: string | null;
  categoryId: string;
  authorId: string;
  coverImageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featured?: boolean;
  tagIds?: string[];
  generatedByAi: boolean;
  status: PostStatus;
  scheduledAt?: Date | null;
};

export async function createPost(input: CreatePostInput): Promise<{ id: string; slug: string }> {
  const status = resolveStatusForCreate(input.actor, input.status, input.generatedByAi);
  const slug = await uniqueSlug(input.title);
  const publishing = status === "PUBLISHED";

  const created = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      summary: input.summary || null,
      content: input.content,
      categoryId: input.categoryId,
      authorId: input.authorId,
      coverImageUrl: input.coverImageUrl || null,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      featured: input.featured ?? false,
      status,
      scheduledAt: status === "SCHEDULED" ? input.scheduledAt ?? null : null,
      generatedByAi: input.generatedByAi,
      sourceType: (input.generatedByAi ? "AI_ASSISTED" : "HUMAN") as SourceType,
      readingTime: readingTimeMinutes(input.content),
      ...(publishing ? { publishedAt: new Date(), approvedById: input.actor.id } : {}),
      tags: { create: (input.tagIds ?? []).map((tagId) => ({ tagId })) },
    },
  });

  return { id: created.id, slug: created.slug };
}

/** Publica um post imediatamente. Exige que o ator tenha permissão de publicar. */
export async function publishPostNow(postId: string, actor: PostActor): Promise<void> {
  if (!can.publishPosts(actor.role)) {
    throw new Error("Sem permissão para publicar.");
  }
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Notícia não encontrada.");

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      publishedAt: post.publishedAt ?? new Date(),
      approvedById: actor.id,
    },
  });
}

/** Agenda um post para publicação futura. Exige que o ator tenha permissão de publicar. */
export async function schedulePost(postId: string, actor: PostActor, when: Date): Promise<void> {
  if (!can.publishPosts(actor.role)) {
    throw new Error("Sem permissão para agendar publicação.");
  }
  if (when.getTime() <= Date.now()) {
    throw new Error("A data de agendamento deve estar no futuro.");
  }
  await prisma.post.update({
    where: { id: postId },
    data: { status: "SCHEDULED", scheduledAt: when, approvedById: actor.id },
  });
}

/** Rejeita um post (ex.: rascunho de IA descartado). */
export async function rejectPost(postId: string, actor: PostActor): Promise<void> {
  if (!can.approvePosts(actor.role)) {
    throw new Error("Sem permissão para rejeitar.");
  }
  await prisma.post.update({
    where: { id: postId },
    data: { status: "REJECTED", approvedById: actor.id },
  });
}

/** Publica todos os posts agendados cuja data já chegou. Usado pelo cron interno. */
export async function publishDuePosts(actor: PostActor): Promise<{ id: string; title: string; slug: string }[]> {
  const due = await prisma.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    select: { id: true, title: true, slug: true },
  });
  for (const post of due) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), approvedById: actor.id },
    });
  }
  return due;
}

/** Resolve o User real (ADMIN) que age em nome do bot do Telegram. */
export async function resolveTelegramActor(): Promise<PostActor> {
  const email = process.env.TELEGRAM_ADMIN_USER_EMAIL;
  if (!email) {
    throw new Error("TELEGRAM_ADMIN_USER_EMAIL não configurado.");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw new Error("Usuário admin do Telegram não encontrado ou inativo.");
  }
  return { id: user.id, role: user.role };
}
