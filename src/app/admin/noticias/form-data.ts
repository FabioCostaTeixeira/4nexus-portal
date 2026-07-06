import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export async function getFormOptions() {
  const [categories, authors, tags] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.author.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return { categories, authors, tags };
}

export function allowedStatusesFor(role: SessionUser["role"]): string[] {
  if (role === "REDATOR") return ["DRAFT", "PENDING"];
  return ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED", "REJECTED"];
}
