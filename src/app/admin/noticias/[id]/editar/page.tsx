import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aiConfigured, aiProviderInfo } from "@/lib/ai";
import { POST_STATUS } from "@/lib/utils";
import PostForm from "../../PostForm";
import { getFormOptions, allowedStatusesFor } from "../../form-data";

export default async function EditarNoticiaPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: true, author: true },
  });
  if (!post) notFound();

  if (session.role === "REDATOR" && post.author.userId !== session.id) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Você só pode editar notícias próprias.
      </p>
    );
  }

  const { categories, authors, tags } = await getFormOptions();
  const allowed = allowedStatusesFor(session.role);
  // garante que o status atual aparece no select mesmo fora do papel
  if (!allowed.includes(post.status)) allowed.unshift(post.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Editar notícia</h1>
        <span className="text-sm text-slate-500">
          Status atual:{" "}
          <strong>{POST_STATUS[post.status as keyof typeof POST_STATUS] ?? post.status}</strong>
        </span>
      </div>
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          summary: post.summary ?? "",
          content: post.content,
          coverImageUrl: post.coverImageUrl ?? "",
          categoryId: post.categoryId,
          authorId: post.authorId,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          featured: post.featured,
          generatedByAi: post.generatedByAi,
          status: post.status,
          tagIds: post.tags.map((t) => t.tagId),
        }}
        categories={categories}
        authors={authors}
        tags={tags}
        allowedStatuses={allowed}
        aiEnabled={aiConfigured()}
        aiProvider={aiProviderInfo().provider}
        saved={sp.salvo === "1"}
      />
    </div>
  );
}
