import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, POST_STATUS } from "@/lib/utils";

export default async function PreviewNoticiaPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  const { id } = await props.params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true, category: true, tags: { include: { tag: true } } },
  });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800">
        <span>
          PRÉ-VISUALIZAÇÃO —{" "}
          {POST_STATUS[post.status as keyof typeof POST_STATUS] ?? post.status}
        </span>
        <Link href={`/admin/noticias/${post.id}/editar`} className="underline">
          Voltar à edição
        </Link>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
        <span className="inline-block text-xs font-bold uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-2 py-1">
          {post.category.name}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900">
          {post.title}
        </h1>
        {post.summary && <p className="mt-3 text-lg text-slate-600">{post.summary}</p>}
        <p className="mt-4 border-y border-slate-200 py-3 text-sm text-slate-500">
          Por <strong>{post.author.name}</strong>
          {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
          {post.readingTime ? ` · ${post.readingTime} min de leitura` : ""}
          {post.generatedByAi && " · ✦ com apoio de IA"}
        </p>
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.title} className="mt-6 w-full rounded-xl" />
        )}
        <div className="prose-news mt-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
