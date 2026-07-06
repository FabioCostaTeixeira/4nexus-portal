import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import PostCard from "../components/PostCard";
import Pagination from "../components/Pagination";

export const metadata: Metadata = {
  title: "Busca avançada",
  description: "Busque notícias por palavra-chave, categoria, autor, período e tag.",
};

const PER_PAGE = 12;

type SearchParams = {
  q?: string;
  categoria?: string;
  autor?: string;
  tag?: string;
  de?: string;
  ate?: string;
  ordenar?: string;
  pagina?: string;
};

export default async function BuscaPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const page = Math.max(1, parseInt(sp.pagina || "1", 10) || 1);
  const q = (sp.q || "").trim();
  const hasFilters = Boolean(q || sp.categoria || sp.autor || sp.tag || sp.de || sp.ate);

  const [categories, authors, tags] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.author.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const where: Prisma.PostWhereInput = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { content: { contains: q } },
    ];
  }
  if (sp.categoria) where.category = { slug: sp.categoria };
  if (sp.autor) where.author = { slug: sp.autor };
  if (sp.tag) where.tags = { some: { tag: { slug: sp.tag } } };
  if (sp.de || sp.ate) {
    where.publishedAt = {};
    if (sp.de) where.publishedAt.gte = new Date(`${sp.de}T00:00:00`);
    if (sp.ate) where.publishedAt.lte = new Date(`${sp.ate}T23:59:59`);
  }

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sp.ordenar === "acessadas" ? { viewCount: "desc" } : { publishedAt: "desc" };

  const [posts, total] = hasFilters
    ? await Promise.all([
        prisma.post.findMany({
          where,
          orderBy,
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            slug: true,
            title: true,
            summary: true,
            coverImageUrl: true,
            publishedAt: true,
            readingTime: true,
            generatedByAi: true,
            category: { select: { name: true, slug: true } },
            author: { select: { name: true, slug: true } },
          },
        }),
        prisma.post.count({ where }),
      ])
    : [[], 0];

  const paginationParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "pagina") paginationParams[k] = v;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink border-l-4 border-brand-600 pl-3 mb-6">
        Busca avançada
      </h1>

      <form method="GET" className="rounded-xl border border-line bg-surface p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-ink-muted mb-1">
            Palavra-chave
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Ex.: inteligência artificial"
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Categoria</label>
          <select
            name="categoria"
            defaultValue={sp.categoria || ""}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Autor</label>
          <select
            name="autor"
            defaultValue={sp.autor || ""}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          >
            <option value="">Todos</option>
            {authors.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Tag</label>
          <select
            name="tag"
            defaultValue={sp.tag || ""}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          >
            <option value="">Todas</option>
            {tags.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">De</label>
          <input
            type="date"
            name="de"
            defaultValue={sp.de || ""}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Até</label>
          <input
            type="date"
            name="ate"
            defaultValue={sp.ate || ""}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Ordenar por</label>
          <select
            name="ordenar"
            defaultValue={sp.ordenar || "recentes"}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          >
            <option value="recentes">Mais recentes</option>
            <option value="acessadas">Mais acessadas</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-surface-3 hover:bg-brand-400"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="mt-8">
        {!hasFilters ? (
          <p className="text-ink-faint text-sm">
            Use os filtros acima para encontrar notícias por palavra-chave,
            categoria, autor, período ou tag.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-faint mb-5">
              {total === 0
                ? "Nenhum resultado encontrado. Tente outros filtros."
                : `${total} resultado${total > 1 ? "s" : ""} encontrado${total > 1 ? "s" : ""}.`}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={Math.ceil(total / PER_PAGE)}
              basePath="/busca"
              params={paginationParams}
            />
          </>
        )}
      </div>
    </div>
  );
}
