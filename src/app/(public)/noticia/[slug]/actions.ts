"use server";

import { prisma } from "@/lib/db";

export type CommentFormState = { ok: boolean; message: string };

export async function submitComment(
  _prev: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  // honeypot: bots preenchem o campo oculto
  if (String(formData.get("website") || "").trim() !== "") {
    return { ok: true, message: "Comentário enviado! Aparecerá após aprovação da moderação." };
  }

  const postId = String(formData.get("postId") || "");
  const userName = String(formData.get("userName") || "").trim();
  const userEmail = String(formData.get("userEmail") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!postId || !userName || !userEmail || content.length < 3) {
    return { ok: false, message: "Preencha nome, e-mail e comentário." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return { ok: false, message: "Informe um e-mail válido." };
  }
  if (content.length > 2000) {
    return { ok: false, message: "Comentário muito longo (máx. 2000 caracteres)." };
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!post) {
    return { ok: false, message: "Notícia não encontrada." };
  }

  await prisma.comment.create({
    data: {
      postId,
      userName: userName.slice(0, 80),
      userEmail: userEmail.slice(0, 120),
      content,
      status: "PENDING",
    },
  });

  return { ok: true, message: "Comentário enviado! Aparecerá após aprovação da moderação." };
}
