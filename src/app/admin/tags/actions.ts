"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type TagState = { message: string; error: boolean };

export async function saveTag(_prev: TagState, formData: FormData): Promise<TagState> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const active = formData.get("active") === "on";

  if (!name) return { message: "Informe o nome.", error: true };
  const slug = slugify(name);

  const conflict = await prisma.tag.findFirst({
    where: { OR: [{ name }, { slug }], ...(id ? { id: { not: id } } : {}) },
  });
  if (conflict) return { message: "Já existe tag com esse nome.", error: true };

  if (id) {
    await prisma.tag.update({ where: { id }, data: { name, slug, active } });
  } else {
    await prisma.tag.create({ data: { name, slug, active } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/tags");
}

export async function deleteTag(id: string): Promise<TagState> {
  await requireUser(["ADMIN"]);
  const count = await prisma.postTag.count({ where: { tagId: id } });
  if (count > 0) {
    return {
      message: `Não é possível excluir: usada em ${count} notícia(s).`,
      error: true,
    };
  }
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/tags");
}
