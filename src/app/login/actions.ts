"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword, destroySession, type SessionUser } from "@/lib/auth";

export type LoginState = { message: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { message: "Credenciais inválidas." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as SessionUser["role"],
  });

  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
