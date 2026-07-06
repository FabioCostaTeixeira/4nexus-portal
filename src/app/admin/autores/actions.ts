"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type AuthorState = { message: string; error: boolean };

export async function saveAuthor(_prev: AuthorState, formData: FormData): Promise<AuthorState> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const bio = String(formData.get("bio") || "").trim() || null;
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
  const userId = String(formData.get("userId") || "") || null;
  const active = formData.get("active") === "on";

  if (!name) return { message: "Informe o nome.", error: true };
  const slug = slugify(name);

  const conflict = await prisma.author.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (conflict) return { message: "Já existe autor com esse nome/slug.", error: true };

  if (userId) {
    const userConflict = await prisma.author.findFirst({
      where: { userId, ...(id ? { id: { not: id } } : {}) },
    });
    if (userConflict) {
      return { message: "Esse usuário já está vinculado a outro autor.", error: true };
    }
  }

  const data = { name, slug, bio, avatarUrl, userId, active };
  if (id) {
    await prisma.author.update({ where: { id }, data });
  } else {
    await prisma.author.create({ data });
  }
  revalidatePath("/", "layout");
  redirect("/admin/autores");
}
