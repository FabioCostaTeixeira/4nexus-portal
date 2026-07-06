export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const POST_STATUS = {
  DRAFT: "Rascunho",
  PENDING: "Pendente de aprovação",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
  REJECTED: "Rejeitado",
} as const;

export const COMMENT_STATUS = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
} as const;

export const USER_ROLES = {
  ADMIN: "Admin",
  EDITOR: "Editor-chefe",
  REDATOR: "Redator",
  MODERADOR: "Moderador",
} as const;

export function excerpt(text: string, max = 160): string {
  const plain = text.replace(/[#*_`>\[\]()]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > max ? plain.slice(0, max - 1) + "…" : plain;
}
