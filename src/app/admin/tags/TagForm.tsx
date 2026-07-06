"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveTag, deleteTag, type TagState } from "./actions";

const initialState: TagState = { message: "", error: false };

export default function TagForm({
  editing,
}: {
  editing: { id: string; name: string; active: boolean } | null;
}) {
  const [state, formAction, pending] = useActionState(saveTag, initialState);
  const [delState, delAction, delPending] = useActionState(
    async (_prev: TagState, _fd: FormData) =>
      editing ? deleteTag(editing.id) : initialState,
    initialState
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
      <h2 className="font-bold text-slate-900 mb-4">
        {editing ? "Editar tag" : "Nova tag"}
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
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={editing?.active ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Ativa
        </label>
        {(state.message || delState.message) && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              state.error || delState.error
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {state.message || delState.message}
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
              href="/admin/tags"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>
      {editing && (
        <form action={delAction} className="mt-3">
          <button
            disabled={delPending}
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            Excluir tag
          </button>
        </form>
      )}
    </div>
  );
}
