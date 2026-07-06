import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, authors] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.author.findMany({ where: { active: true }, select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/noticias",
    "/busca",
    "/sobre",
    "/contato",
    "/politica-privacidade",
    "/termos-de-uso",
    "/politica-editorial",
  ].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: p === "" ? "hourly" : "monthly",
    priority: p === "" ? 1 : 0.5,
  }));

  return [
    ...staticPages,
    ...posts.map((p) => ({
      url: `${siteUrl}/noticia/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/categoria/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...authors.map((a) => ({
      url: `${siteUrl}/autor/${a.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
