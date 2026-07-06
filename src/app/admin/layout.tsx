import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { USER_ROLES } from "@/lib/utils";
import { logout } from "../login/actions";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pendingComments = can.moderateComments(session.role)
    ? await prisma.comment.count({ where: { status: "PENDING" } })
    : 0;

  const items = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/noticias", label: "Notícias", show: can.managePosts(session.role) },
    {
      href: "/admin/comentarios",
      label: "Comentários",
      show: can.moderateComments(session.role),
      badge: pendingComments || undefined,
    },
    { href: "/admin/categorias", label: "Categorias", show: can.manageTaxonomy(session.role) },
    { href: "/admin/tags", label: "Tags", show: can.manageTaxonomy(session.role) },
    { href: "/admin/autores", label: "Autores", show: can.manageTaxonomy(session.role) },
    { href: "/admin/usuarios", label: "Usuários", show: can.manageUsers(session.role) },
  ].filter((i) => i.show);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden md:flex w-60 flex-col bg-slate-900 text-slate-300">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/admin" className="text-lg font-bold text-white">
            4NEXUS <span className="text-brand-400">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white"
            >
              {i.label}
              {i.badge ? (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                  {i.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Ver portal ↗
          </Link>
        </nav>
        <div className="border-t border-slate-800 px-5 py-4">
          <p className="text-sm font-semibold text-white">{session.name}</p>
          <p className="text-xs text-slate-400">{USER_ROLES[session.role]}</p>
          <form action={logout} className="mt-3">
            <button className="text-xs text-slate-400 hover:text-white underline">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <AdminNav
          items={items.map(({ href, label, badge }) => ({ href, label, badge }))}
          userName={session.name}
          roleLabel={USER_ROLES[session.role]}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
