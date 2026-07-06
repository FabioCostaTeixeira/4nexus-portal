import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import TaxForm from "./TaxForm";
import { toggleCategory } from "./actions";

export default async function CategoriasPage(props: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const sp = await props.searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  const editing = sp.editar ? categories.find((c) => c.id === sp.editar) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>

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
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                  <td className="px-4 py-3 text-slate-500">{c._count.posts}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.active ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/categorias?editar=${c.id}`}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await toggleCategory(c.id);
                        }}
                      >
                        <button className="text-xs font-medium text-slate-500 hover:underline">
                          {c.active ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TaxForm
          key={editing?.id ?? "new"}
          editing={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  description: editing.description ?? "",
                  active: editing.active,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
