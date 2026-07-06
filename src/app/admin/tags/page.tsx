import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import TagForm from "./TagForm";

export default async function TagsPage(props: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const sp = await props.searchParams;

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  const editing = sp.editar ? tags.find((t) => t.id === sp.editar) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Tags</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Notícias</th>
                <th className="px-4 py-3">Ativa</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tags.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.slug}</td>
                  <td className="px-4 py-3 text-slate-500">{t._count.posts}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t.active ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tags?editar=${t.id}`}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TagForm
          key={editing?.id ?? "new"}
          editing={editing ? { id: editing.id, name: editing.name, active: editing.active } : null}
        />
      </div>
    </div>
  );
}
