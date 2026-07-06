import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostCard from "../../components/PostCard";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const author = await prisma.author.findFirst({ where: { slug, active: true } });
  if (!author) return { title: "Autor não encontrado" };
  return {
    title: `${author.name} — Autor`,
    description: author.bio || `Notícias e artigos de ${author.name}.`,
  };
}

export default async function AutorPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const author = await prisma.author.findFirst({
    where: { slug, active: true },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
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
      },
    },
  });
  if (!author) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-6">
        {author.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-ink">{author.name}</h1>
          {author.bio && <p className="mt-1 text-sm text-ink-muted">{author.bio}</p>}
        </div>
      </div>

      <h2 className="mt-10 mb-5 text-xl font-bold text-ink border-l-4 border-brand-600 pl-3">
        Publicações de {author.name}
      </h2>
      {author.posts.length === 0 ? (
        <p className="text-ink-faint">Nenhuma publicação ainda.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {author.posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
