import Link from "next/link";
import { formatDate } from "@/lib/utils";

export type PostCardData = {
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingTime: number | null;
  generatedByAi: boolean;
  category: { name: string; slug: string };
  author: { name: string; slug: string };
};

export default function PostCard({
  post,
  large = false,
}: {
  post: PostCardData;
  large?: boolean;
}) {
  return (
    <div className="tilt-wrap h-full">
      <article className="tilt-card group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <Link href={`/noticia/${post.slug}`} className="block overflow-hidden">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
                large ? "aspect-[16/8]" : "aspect-[16/9]"
              }`}
            />
          ) : (
            <div className={`w-full bg-surface-2 ${large ? "aspect-[16/8]" : "aspect-[16/9]"}`} />
          )}
        </Link>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <Link
            href={`/categoria/${post.category.slug}`}
            className="self-start rounded bg-brand-600/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-500 transition-colors hover:bg-brand-600/25"
          >
            {post.category.name}
          </Link>
          <Link href={`/noticia/${post.slug}`}>
            <h3
              className={`font-extrabold leading-snug text-ink transition-colors group-hover:text-brand-500 ${
                large ? "text-2xl" : "text-lg"
              }`}
            >
              {post.title}
            </h3>
          </Link>
          {post.summary && (
            <p className="text-sm text-ink-muted line-clamp-2">{post.summary}</p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-xs text-ink-faint">
            <Link href={`/autor/${post.author.slug}`} className="font-medium transition-colors hover:text-brand-500">
              {post.author.name}
            </Link>
            <span>·</span>
            <time>{formatDate(post.publishedAt)}</time>
            {post.readingTime ? (
              <>
                <span>·</span>
                <span>{post.readingTime} min</span>
              </>
            ) : null}
            {post.generatedByAi && (
              <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
                IA + revisão
              </span>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
