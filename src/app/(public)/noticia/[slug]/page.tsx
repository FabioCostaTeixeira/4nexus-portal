import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import PostCard from "../../components/PostCard";
import ShareButtons from "../../components/ShareButtons";
import CommentForm from "../../components/CommentForm";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "Notícia não encontrada" };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.summary || "";
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/noticia/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${siteUrl}/noticia/${post.slug}`,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function NoticiaPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  // contador de visualizações — não bloqueia a renderização
  prisma.post
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const related = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
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
  });

  const url = `${siteUrl}/noticia/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.metaDescription || post.summary || "",
    image: post.coverImageUrl ? [`${siteUrl}${post.coverImageUrl}`] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: `${siteUrl}/autor/${post.author.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "4Nexus",
      url: siteUrl,
    },
    mainEntityOfPage: url,
  };

  const updatedDiffers =
    post.publishedAt &&
    post.updatedAt.toDateString() !== post.publishedAt.toDateString();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href={`/categoria/${post.category.slug}`}
        className="inline-block text-xs font-bold uppercase tracking-wide text-brand-500 bg-brand-600/15 rounded px-2 py-1"
      >
        {post.category.name}
      </Link>

      <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight text-ink">
        {post.title}
      </h1>

      {post.summary && (
        <p className="mt-3 text-lg text-ink-muted">{post.summary}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-line py-3">
        {post.author.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author.avatarUrl}
            alt={post.author.name}
            className="h-10 w-10 rounded-full"
          />
        )}
        <div className="text-sm">
          <Link
            href={`/autor/${post.author.slug}`}
            className="font-semibold text-ink hover:text-brand-500"
          >
            {post.author.name}
          </Link>
          <p className="text-ink-faint">
            Publicado em {formatDate(post.publishedAt)}
            {updatedDiffers && ` · Atualizado em ${formatDate(post.updatedAt)}`}
            {post.readingTime ? ` · ${post.readingTime} min de leitura` : ""}
          </p>
        </div>
      </div>

      {post.generatedByAi && (
        <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-faint">
          ✦ Conteúdo produzido com apoio de inteligência artificial e revisado
          por editor humano, conforme nossa{" "}
          <Link href="/politica-editorial" className="underline">
            política editorial
          </Link>
          .
        </p>
      )}

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="mt-6 w-full rounded-xl"
        />
      )}

      <div className="prose-news mt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted hover:bg-brand-600/20 hover:text-brand-500"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <ShareButtons url={url} title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink mb-5 border-l-4 border-brand-600 pl-3">
            Notícias relacionadas
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" id="comentarios">
        <h2 className="text-xl font-bold text-ink mb-5 border-l-4 border-brand-600 pl-3">
          Comentários ({post.comments.length})
        </h2>
        <div className="space-y-4 mb-8">
          {post.comments.length === 0 && (
            <p className="text-sm text-ink-faint">
              Seja o primeiro a comentar.
            </p>
          )}
          {post.comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-ink">{c.userName}</span>
                <span className="text-xs text-ink-faint">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink-muted whitespace-pre-line">
                {c.content}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">
            Deixe seu comentário
          </h3>
          <CommentForm postId={post.id} />
        </div>
      </section>
    </article>
  );
}
