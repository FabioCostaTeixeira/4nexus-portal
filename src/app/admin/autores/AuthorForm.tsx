"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAuthor, type AuthorState } from "./actions";

const initialState: AuthorState = { message: "", error: false };

type Editing = {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  userId: string;
  active: boolean;
} | null;

export default function AuthorForm({
  editing,
  users,
}: {
  editing: Editing;
  users: { id: string; name: string; email: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveAuthor, initialState);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
      <h2 className="font-bold text-slate-900 mb-4">
        {editing ? "Editar autor" : "Novo autor"}
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={editing?.bio ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">URL do avatar</label>
          <input
            name="avatarUrl"
            defaultValue={editing?.avatarUrl ?? ""}
            placeholder="/uploads/… ou https://…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Usuário vinculado
          </label>
          <select
            name="userId"
            defaultValue={editing?.userId ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Nenhum</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
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
              href="/admin/autores"
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
