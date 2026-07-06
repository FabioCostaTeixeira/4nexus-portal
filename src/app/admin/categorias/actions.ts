"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type TaxState = { message: string; error: boolean };

export async function saveCategory(_prev: TaxState, formData: FormData): Promise<TaxState> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const active = formData.get("active") === "on";

  if (!name) return { message: "Informe o nome.", error: true };
  const slug = slugify(name);

  const conflict = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }], ...(id ? { id: { not: id } } : {}) },
  });
  if (conflict) return { message: "Já existe categoria com esse nome.", error: true };

  if (id) {
    await prisma.category.update({ where: { id }, data: { name, slug, description, active } });
  } else {
    await prisma.category.create({ data: { name, slug, description, active } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/categorias");
}

export async function toggleCategory(id: string) {
  await requireUser(["ADMIN"]);
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return;
  await prisma.category.update({ where: { id }, data: { active: !cat.active } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/categorias");
}

export async function deleteCategory(id: string): Promise<TaxState> {
  await requireUser(["ADMIN"]);
  const count = await prisma.post.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      message: `Não é possível excluir: ${count} notícia(s) vinculada(s). Inative a categoria.`,
      error: true,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/categorias");
}
