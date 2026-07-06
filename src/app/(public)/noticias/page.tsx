import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";

export const metadata: Metadata = {
  title: "Todas as notícias",
  description: "Últimas notícias de tecnologia, inovação, IA e mercado da 4Nexus.",
};

const PER_PAGE = 12;

export default async function NoticiasPage(props: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sp = await props.searchParams;
  const page = Math.max(1, parseInt(sp.pagina || "1", 10) || 1);

  const where = { status: "PUBLISHED" as const };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true,
        title: true,
        summary: true,
        coverImageUrl: true,
        publishedAt: true,
        readingTime: true,
        generatedByAi: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true, slug: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink border-l-4 border-brand-600 pl-3 mb-6">
        Todas as notícias
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        basePath="/noticias"
      />
    </div>
  );
}
