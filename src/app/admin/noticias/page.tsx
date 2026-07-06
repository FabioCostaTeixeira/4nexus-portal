import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";
import { formatDateTime, POST_STATUS } from "@/lib/utils";
import { changePostStatus } from "./actions";
import type { Prisma, PostStatus } from "@prisma/client";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function NoticiasAdminPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await requireUser(["ADMIN", "EDITOR", "REDATOR"]);
  const sp = await props.searchParams;
  const status = sp.status && sp.status in POST_STATUS ? sp.status : "";
  const q = (sp.q || "").trim();

  const where: Prisma.PostWhereInput = {};
  if (status) where.status = status as PostStatus;
  if (q) where.title = { contains: q };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { category: true, author: true },
  });

  const canApprove = can.approvePosts(session.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Notícias</h1>
        <Link
          href="/admin/noticias/nova"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nova notícia
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(POST_STATUS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm flex-1 min-w-40"
        />
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Atualizado</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma notícia encontrada.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/noticias/${p.id}/editar`}
                    className="font-semibold text-slate-800 hover:text-brand-700"
                  >
                    {p.title}
                  </Link>
                  {p.generatedByAi && (
                    <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      IA
                    </span>
                  )}
                  {p.featured && (
                    <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      ★
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.author.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status] || ""}`}>
                    {POST_STATUS[p.status as keyof typeof POST_STATUS] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.viewCount}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDateTime(p.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {canApprove && p.status === "PENDING" && (
                      <form
                        action={async () => {
                          "use server";
                          await changePostStatus(p.id, "PUBLISHED");
                        }}
                      >
                        <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700">
                          Aprovar
                        </button>
                      </form>
                    )}
                    {canApprove && p.status === "PENDING" && (
                      <form
                        action={async () => {
                          "use server";
                          await changePostStatus(p.id, "REJECTED");
                        }}
                      >
                        <button className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                          Rejeitar
                        </button>
                      </form>
                    )}
                    {canApprove && p.status === "PUBLISHED" && (
                      <form
                        action={async () => {
                          "use server";
                          await changePostStatus(p.id, "ARCHIVED");
                        }}
                      >
                        <button className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          Arquivar
                        </button>
                      </form>
                    )}
                    {p.status === "PUBLISHED" && (
                      <Link
                        href={`/noticia/${p.slug}`}
                        target="_blank"
                        className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Ver ↗
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
