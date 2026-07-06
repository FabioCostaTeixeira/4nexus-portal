import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboard() {
  const [published, drafts, pending, pendingComments, viewsAgg, pendingPosts, latestComments] =
    await Promise.all([
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.post.findMany({
        where: { status: "PENDING" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { author: true, category: true },
      }),
      prisma.comment.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { post: { select: { title: true, slug: true } } },
      }),
    ]);

  const cards = [
    { label: "Publicadas", value: published, href: "/admin/noticias?status=PUBLISHED" },
    { label: "Rascunhos", value: drafts, href: "/admin/noticias?status=DRAFT" },
    { label: "Pendentes de aprovação", value: pending, href: "/admin/noticias?status=PENDING" },
    { label: "Comentários pendentes", value: pendingComments, href: "/admin/comentarios" },
    {
      label: "Visualizações totais",
      value: (viewsAgg._sum.viewCount ?? 0).toLocaleString("pt-BR"),
      href: "/admin/noticias",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/admin/noticias/nova"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nova notícia
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm"
          >
            <p className="text-3xl font-extrabold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900 mb-4">Aguardando aprovação</h2>
          {pendingPosts.length === 0 ? (
            <p className="text-sm text-slate-500">Nada pendente. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingPosts.map((p) => (
                <li key={p.id} className="py-2.5">
                  <Link
                    href={`/admin/noticias/${p.id}/editar`}
                    className="text-sm font-semibold text-slate-800 hover:text-brand-700"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {p.category.name} · {p.author.name}
                    {p.generatedByAi && " · gerado com IA"} · {formatDateTime(p.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900 mb-4">Últimos comentários pendentes</h2>
          {latestComments.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum comentário aguardando moderação.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestComments.map((c) => (
                <li key={c.id} className="py-2.5">
                  <p className="text-sm text-slate-700 line-clamp-2">
                    <span className="font-semibold">{c.userName}:</span> {c.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    em <span className="italic">{c.post.title}</span> ·{" "}
                    {formatDateTime(c.createdAt)} ·{" "}
                    <Link href="/admin/comentarios" className="text-brand-700 hover:underline">
                      moderar
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
