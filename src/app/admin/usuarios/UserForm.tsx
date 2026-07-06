"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveUser, type UserState } from "./actions";

const initialState: UserState = { message: "", error: false };

const ROLE_OPTIONS = [
  ["ADMIN", "Admin"],
  ["EDITOR", "Editor-chefe"],
  ["REDATOR", "Redator"],
  ["MODERADOR", "Moderador"],
] as const;

type Editing = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
} | null;

export default function UserForm({ editing }: { editing: Editing }) {
  const [state, formAction, pending] = useActionState(saveUser, initialState);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
      <h2 className="font-bold text-slate-900 mb-4">
        {editing ? "Editar usuário" : "Novo usuário"}
      </h2>
      <form action={formAction} className="space-y-3">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nome *</label>
          <input
            name="name"
            required
            defaultValue={editing?.name ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail *</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={editing?.email ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Papel *</label>
          <select
            name="role"
            defaultValue={editing?.role ?? "REDATOR"}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            {editing ? "Nova senha (deixe vazio para manter)" : "Senha * (mín. 8 caracteres)"}
          </label>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required={!editing}
            minLength={editing ? undefined : 8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={editing?.active ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Ativo
        </label>
        {state.message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              state.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {state.message}
          </p>
        )}
        <div className="flex gap-2">
          <button
            disabled={pending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
          {editing && (
            <Link
              href="/admin/usuarios"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
