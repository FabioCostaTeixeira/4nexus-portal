"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "../login/actions";

type Item = { href: string; label: string; badge?: number };

export default function AdminNav({
  items,
  userName,
  roleLabel,
}: {
  items: Item[];
  userName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden bg-slate-900 text-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="font-bold text-white">
          4NEXUS <span className="text-brand-400">Admin</span>
        </Link>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="px-3 pb-3 space-y-1">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-slate-800"
            >
              {i.label}
              {i.badge ? (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                  {i.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <Link href="/" target="_blank" className="block rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800">
            Ver portal ↗
          </Link>
          <div className="border-t border-slate-800 mt-2 pt-2 px-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {userName} · {roleLabel}
            </span>
            <form action={logout}>
              <button className="text-xs text-slate-400 underline">Sair</button>
            </form>
          </div>
        </nav>
      )}
    </div>
  );
}
