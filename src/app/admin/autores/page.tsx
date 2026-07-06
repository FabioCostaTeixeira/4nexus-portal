import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import AuthorForm from "./AuthorForm";

export default async function AutoresPage(props: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const sp = await props.searchParams;

  const [authors, users] = await Promise.all([
    prisma.author.findMany({
      orderBy: { name: "asc" },
      include: { user: true, _count: { select: { posts: true } } },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const editing = sp.editar ? authors.find((a) => a.id === sp.editar) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Autores</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Notícias</th>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authors.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatarUrl} alt={a.name} className="h-8 w-8 rounded-full" />
                      )}
                      <span className="font-medium text-slate-800">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.user?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{a._count.posts}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.active ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/autores?editar=${a.id}`}
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
        <AuthorForm
          key={editing?.id ?? "new"}
          editing={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  bio: editing.bio ?? "",
                  avatarUrl: editing.avatarUrl ?? "",
                  userId: editing.userId ?? "",
                  active: editing.active,
                }
              : null
          }
          users={users}
        />
      </div>
    </div>
  );
}
