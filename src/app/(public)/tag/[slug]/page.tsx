import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostCard from "../../components/PostCard";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const tag = await prisma.tag.findFirst({ where: { slug, active: true } });
  if (!tag) return { title: "Tag não encontrada" };
  return {
    title: `#${tag.name}`,
    description: `Notícias marcadas com a tag ${tag.name} no portal 4Nexus.`,
  };
}

export default async function TagPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const tag = await prisma.tag.findFirst({
    where: { slug, active: true },
    include: {
      posts: {
        where: { post: { status: "PUBLISHED" } },
        include: {
          post: {
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
        orderBy: { post: { publishedAt: "desc" } },
      },
    },
  });
  if (!tag) notFound();

  const posts = tag.posts.map((pt) => pt.post);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink border-l-4 border-brand-600 pl-3 mb-6">
        #{tag.name}
      </h1>
      {posts.length === 0 ? (
        <p className="text-ink-faint">Nenhuma notícia com esta tag ainda.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
