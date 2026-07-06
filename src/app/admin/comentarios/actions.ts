"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";

export async function moderateComment(
  commentId: string,
  action: "APPROVE" | "REJECT" | "DELETE",
  reason?: string
) {
  const session = await requireUser(["ADMIN", "EDITOR", "MODERADOR"]);
  if (!can.moderateComments(session.role)) throw new Error("Sem permissão.");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { slug: true } } },
  });
  if (!comment) throw new Error("Comentário não encontrado.");

  if (action === "DELETE") {
    if (session.role !== "ADMIN") throw new Error("Só o Admin remove comentários.");
    await prisma.comment.delete({ where: { id: commentId } });
  } else if (action === "APPROVE") {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        moderatedById: session.id,
        rejectedReason: null,
      },
    });
  } else {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: "REJECTED",
        moderatedById: session.id,
        rejectedReason: reason?.trim() || "Não informado",
      },
    });
  }

  revalidatePath(`/noticia/${comment.post.slug}`);
  revalidatePath("/admin/comentarios");
  revalidatePath("/admin", "layout");
}
