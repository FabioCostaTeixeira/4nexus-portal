import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar — Painel administrativo",
  robots: { index: false },
};

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await props.searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-center text-xl font-bold text-slate-900 mb-1">
            4NEXUS <span className="text-brand-600">Admin</span>
          </p>
          <p className="text-center text-sm text-slate-500 mb-6">
            Painel editorial do portal de notícias
          </p>
          <LoginForm next={next} />
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold mb-1">Acesso de demonstração:</p>
            <p>admin@4nexus.com.br · Admin@4nexus2026</p>
          </div>
        </div>
        <p className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Voltar ao portal
          </Link>
        </p>
      </div>
    </div>
  );
}
