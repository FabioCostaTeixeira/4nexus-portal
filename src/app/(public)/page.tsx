import Link from "next/link";
import { prisma } from "@/lib/db";
import PostCard from "./components/PostCard";
import Reveal from "./components/Reveal";

const cardSelect = {
  slug: true,
  title: true,
  summary: true,
  coverImageUrl: true,
  publishedAt: true,
  readingTime: true,
  generatedByAi: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, slug: true } },
} as const;

export default async function HomePage() {
  const [featured, recent, mostRead, categories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: cardSelect,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 9,
      select: cardSelect,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { slug: true, title: true, viewCount: true, category: { select: { name: true } } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);

  const hero = featured[0] ?? recent[0];
  const secondary = featured.slice(1, 3);
  const heroSlugs = new Set([hero?.slug, ...secondary.map((p) => p.slug)]);
  const recentFiltered = recent.filter((p) => !heroSlugs.has(p.slug)).slice(0, 6);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-line bg-surface-2">
        {/* orbes decorativos */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl float-slow" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-600/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="hero-in-1 mb-3 inline-flex items-center gap-2 rounded-full border border-brand-600/40 bg-brand-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Espírito Santo · Notícias
          </p>
          <h1 className="hero-in-1 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Portal <span className="text-grad-brand grad-animate">4Nexus</span>
          </h1>
          <p className="hero-in-2 mt-3 max-w-2xl text-xl font-semibold text-ink sm:text-3xl">
            A sua nova casa de notícias do <span className="text-brand-500">ES</span>.
          </p>
          <p className="hero-in-3 mt-4 max-w-xl text-sm text-ink-muted sm:text-base">
            Do agro às pedras ornamentais, da política ao esporte — cobertura
            completa do que move o Espírito Santo, todos os dias.
          </p>
          <div className="hero-in-4 mt-8 flex flex-wrap gap-3">
            <Link
              href="/noticias"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-surface-3 shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-brand-600/40"
            >
              Últimas notícias
            </Link>
            <Link
              href="/busca"
              className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-600/50 hover:text-brand-500"
            >
              Busca avançada
            </Link>
          </div>

          {/* categorias em pílulas */}
          <div className="hero-in-4 mt-8 flex flex-wrap gap-2">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                style={{ animationDelay: `${500 + i * 60}ms` }}
                className="rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-semibold text-ink-muted backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-600/60 hover:text-brand-500"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        {/* ===== DESTAQUES ===== */}
        {hero && (
          <section>
            <Reveal anim="left">
              <h2 className="mb-5 border-l-4 border-brand-600 pl-3 text-2xl font-extrabold text-ink">
                Destaques
              </h2>
            </Reveal>
            <div className="grid gap-6 lg:grid-cols-3">
              <Reveal anim="zoom" className="lg:col-span-2">
                <PostCard post={hero} large />
              </Reveal>
              <div className="grid content-start gap-6">
                {secondary.map((p, i) => (
                  <Reveal key={p.slug} anim="right" delay={i * 140}>
                    <PostCard post={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          {/* ===== MAIS RECENTES ===== */}
          <section className="lg:col-span-2">
            <Reveal anim="left">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="border-l-4 border-brand-600 pl-3 text-2xl font-extrabold text-ink">
                  Mais recentes
                </h2>
                <Link href="/noticias" className="text-sm font-bold text-brand-500 hover:underline">
                  Ver todas →
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              {recentFiltered.map((p, i) => (
                <Reveal key={p.slug} anim="up" delay={(i % 2) * 120}>
                  <PostCard post={p} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* ===== SIDEBAR ===== */}
          <aside className="space-y-8">
            {mostRead.length > 0 && (
              <Reveal anim="right">
                <section className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="mb-4 border-l-4 border-brand-600 pl-3 text-lg font-extrabold text-ink">
                    Mais lidas
                  </h2>
                  <ol className="space-y-3">
                    {mostRead.map((p, i) => (
                      <li key={p.slug} className="flex gap-3">
                        <span className="text-2xl font-black leading-none text-brand-600/50">
                          {i + 1}
                        </span>
                        <div>
                          <Link
                            href={`/noticia/${p.slug}`}
                            className="text-sm font-semibold leading-snug text-ink transition-colors hover:text-brand-500"
                          >
                            {p.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {p.category.name} · {p.viewCount.toLocaleString("pt-BR")} visualizações
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            )}

            <Reveal anim="right" delay={120}>
              <section className="relative overflow-hidden rounded-xl border border-brand-600/30 bg-gradient-to-br from-surface to-surface-2 p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-600/15 blur-2xl" />
                <h2 className="text-lg font-extrabold text-ink">
                  Notícias do <span className="text-brand-500">ES</span>, direto ao ponto
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Cobertura dos setores que movem a economia capixaba: agro,
                  rochas ornamentais, metalmecânico e muito mais.
                </p>
                <Link
                  href="/sobre"
                  className="mt-4 inline-block text-sm font-bold text-brand-500 hover:underline"
                >
                  Conheça o portal →
                </Link>
              </section>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
