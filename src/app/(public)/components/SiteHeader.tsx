"use client";

import Link from "next/link";
import { useState } from "react";

type Cat = { name: string; slug: string };

export default function SiteHeader({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-2/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-4nexus-light.png"
              alt="Portal 4Nexus"
              className="h-8 w-auto"
            />
            <span className="hidden sm:inline-block rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-surface-2">
              Portal
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-5">
            {categories.slice(0, 7).map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="text-sm font-medium text-ink-muted transition-colors hover:text-brand-500"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/noticias"
              className="text-sm font-medium text-ink-muted transition-colors hover:text-brand-500"
            >
              Todas
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/busca"
              aria-label="Buscar"
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-surface hover:text-brand-500"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="hidden md:inline-block text-xs font-medium text-ink-faint transition-colors hover:text-ink-muted"
            >
              Entrar
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="rounded p-2 text-ink-muted hover:bg-surface lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 pb-4 lg:hidden">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2 text-sm font-medium text-ink-muted hover:bg-surface hover:text-brand-500"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/noticias"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-2 text-sm font-medium text-ink-muted hover:bg-surface hover:text-brand-500"
            >
              Todas as notícias
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-2 text-sm font-medium text-ink-faint hover:bg-surface"
            >
              Entrar
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
