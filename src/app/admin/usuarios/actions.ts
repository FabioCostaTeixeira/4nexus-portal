"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword } from "@/lib/auth";

export type UserState = { message: string; error: boolean };

const ROLES: UserRole[] = ["ADMIN", "EDITOR", "REDATOR", "MODERADOR"];

export async function saveUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const session = await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "REDATOR") as UserRole;
  const password = String(formData.get("password") || "");
  const active = formData.get("active") === "on";

  if (!name || !email) return { message: "Informe nome e e-mail.", error: true };
  if (!ROLES.includes(role)) return { message: "Papel inválido.", error: true };
  if (!id && password.length < 8) {
    return { message: "Senha deve ter no mínimo 8 caracteres.", error: true };
  }
  if (id === session.id && !active) {
    return { message: "Você não pode desativar o próprio usuário.", error: true };
  }

  const conflict = await prisma.user.findFirst({
    where: { email, ...(id ? { id: { not: id } } : {}) },
  });
  if (conflict) return { message: "Já existe usuário com esse e-mail.", error: true };

  if (id) {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        active,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        role,
        active,
        passwordHash: await hashPassword(password),
      },
    });
  }
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
