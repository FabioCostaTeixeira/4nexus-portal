import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "portal_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-in-production"
);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "REDATOR" | "MODERADOR";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Retorna o usuário logado ou lança erro (para server actions do admin). */
export async function requireUser(roles?: SessionUser["role"][]) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  if (roles && roles.length > 0 && !roles.includes(session.role)) {
    throw new Error("Sem permissão para esta ação.");
  }
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) throw new Error("Usuário inativo.");
  return session;
}

/** Permissões por papel, conforme a demanda. */
export const can = {
  managePosts: (r: string) => ["ADMIN", "EDITOR", "REDATOR"].includes(r),
  approvePosts: (r: string) => ["ADMIN", "EDITOR"].includes(r),
  publishPosts: (r: string) => ["ADMIN", "EDITOR"].includes(r),
  deletePosts: (r: string) => ["ADMIN"].includes(r),
  manageTaxonomy: (r: string) => ["ADMIN"].includes(r), // categorias, tags, autores
  manageUsers: (r: string) => ["ADMIN"].includes(r),
  moderateComments: (r: string) => ["ADMIN", "EDITOR", "MODERADOR"].includes(r),
  useAi: (r: string) => ["ADMIN", "EDITOR", "REDATOR"].includes(r),
};
