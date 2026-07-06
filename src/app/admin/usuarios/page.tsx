import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { USER_ROLES, formatDate } from "@/lib/utils";
import UserForm from "./UserForm";

export default async function UsuariosPage(props: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const session = await requireUser(["ADMIN"]);
  const sp = await props.searchParams;

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const editing = sp.editar ? users.find((u) => u.id === sp.editar) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3">Criado</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.name}
                    {u.id === session.id && (
                      <span className="ml-2 text-xs text-slate-400">(você)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {USER_ROLES[u.role as keyof typeof USER_ROLES] ?? u.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.active ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/usuarios?editar=${u.id}`}
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
        <UserForm
          key={editing?.id ?? "new"}
          editing={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  email: editing.email,
                  role: editing.role,
                  active: editing.active,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
