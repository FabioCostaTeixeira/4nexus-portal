"use client";

import { useActionState } from "react";
import { submitComment, type CommentFormState } from "../noticia/[slug]/actions";

const initialState: CommentFormState = { ok: false, message: "" };

export default function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(submitComment, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {/* honeypot anti-spam */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="userName"
          required
          maxLength={80}
          placeholder="Seu nome"
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
        />
        <input
          name="userEmail"
          type="email"
          required
          maxLength={120}
          placeholder="Seu e-mail (não será publicado)"
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
        />
      </div>
      <textarea
        name="content"
        required
        minLength={3}
        maxLength={2000}
        rows={4}
        placeholder="Escreva seu comentário…"
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
      />
      {state.message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            state.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-surface-3 hover:bg-brand-400 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar comentário"}
      </button>
      <p className="text-xs text-ink-faint">
        Comentários passam por moderação antes de aparecer no portal.
      </p>
    </form>
  );
}
