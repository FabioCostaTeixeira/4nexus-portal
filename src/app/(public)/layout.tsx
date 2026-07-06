import Link from "next/link";
import { prisma } from "@/lib/db";
import SiteHeader from "./components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-line bg-surface-3">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-4nexus-light.png"
              alt="Portal 4Nexus"
              className="h-9 w-auto"
            />
            <p className="mt-3 text-sm text-ink-faint">
              A sua nova casa de notícias do Espírito Santo. Agro, pedras,
              política, esporte, saúde, concursos e tecnologia — com produção
              editorial responsável.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-500">
              Categorias
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    className="text-sm text-ink-muted transition-colors hover:text-brand-500"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-500">
              Institucional
            </p>
            <ul className="space-y-1.5">
              <li><Link href="/sobre" className="text-sm text-ink-muted transition-colors hover:text-brand-500">Sobre a 4Nexus</Link></li>
              <li><Link href="/contato" className="text-sm text-ink-muted transition-colors hover:text-brand-500">Contato</Link></li>
              <li><Link href="/politica-privacidade" className="text-sm text-ink-muted transition-colors hover:text-brand-500">Política de privacidade</Link></li>
              <li><Link href="/termos-de-uso" className="text-sm text-ink-muted transition-colors hover:text-brand-500">Termos de uso</Link></li>
              <li><Link href="/politica-editorial" className="text-sm text-ink-muted transition-colors hover:text-brand-500">Política editorial</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-ink-faint">
          © {new Date().getFullYear()} 4Nexus. Todos os direitos reservados. ·
          Vitória, Espírito Santo
        </div>
      </footer>
    </div>
  );
}
