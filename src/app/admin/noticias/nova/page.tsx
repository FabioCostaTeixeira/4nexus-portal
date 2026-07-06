import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aiConfigured, aiProviderInfo } from "@/lib/ai";
import PostForm from "../PostForm";
import { getFormOptions, allowedStatusesFor } from "../form-data";

export default async function NovaNoticiaPage() {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  const { categories, authors, tags } = await getFormOptions();

  // pré-seleciona o autor vinculado ao usuário logado, se houver
  const ownAuthor = await prisma.author.findFirst({ where: { userId: session.id } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Nova notícia</h1>
      <PostForm
        post={{
          title: "",
          slug: "",
          summary: "",
          content: "",
          coverImageUrl: "",
          categoryId: "",
          authorId: ownAuthor?.id ?? "",
          metaTitle: "",
          metaDescription: "",
          featured: false,
          generatedByAi: false,
          status: "DRAFT",
          tagIds: [],
        }}
        categories={categories}
        authors={authors}
        tags={tags}
        allowedStatuses={allowedStatusesFor(session.role)}
        aiEnabled={aiConfigured()}
        aiProvider={aiProviderInfo().provider}
      />
    </div>
  );
}
