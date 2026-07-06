import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams({ ...params, pagina: String(p) });
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Paginação">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="px-3 py-1.5 rounded border border-line text-sm text-ink-muted hover:bg-surface-2"
        >
          ← Anterior
        </Link>
      )}
      <span className="text-sm text-ink-faint">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          className="px-3 py-1.5 rounded border border-line text-sm text-ink-muted hover:bg-surface-2"
        >
          Próxima →
        </Link>
      )}
    </nav>
  );
}
