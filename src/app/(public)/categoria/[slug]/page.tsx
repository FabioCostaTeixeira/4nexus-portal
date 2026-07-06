import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostCard from "../../components/PostCard";
import Pagination from "../../components/Pagination";

const PER_PAGE = 12;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await prisma.category.findFirst({
    where: { slug, active: true },
  });
  if (!category) return { title: "Categoria não encontrada" };
  return {
    title: category.name,
    description: category.description || `Notícias de ${category.name} no portal 4Nexus.`,
  };
}

export default async function CategoriaPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  const page = Math.max(1, parseInt(sp.pagina || "1", 10) || 1);

  const category = await prisma.category.findFirst({
    where: { slug, active: true },
  });
  if (!category) notFound();

  const where = { status: "PUBLISHED" as const, categoryId: category.id };
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
      <h1 className="text-2xl font-bold text-ink border-l-4 border-brand-600 pl-3">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 text-ink-muted">{category.description}</p>
      )}
      {posts.length === 0 ? (
        <p className="mt-10 text-ink-faint">
          Ainda não há notícias publicadas nesta categoria.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        basePath={`/categoria/${slug}`}
      />
    </div>
  );
}
