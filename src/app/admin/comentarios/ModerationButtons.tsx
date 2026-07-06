"use client";

import { useTransition } from "react";
import { moderateComment } from "./actions";

export default function ModerationButtons({
  commentId,
  status,
  isAdmin,
}: {
  commentId: string;
  status: string;
  isAdmin: boolean;
}) {
  const [pending, start] = useTransition();

  function run(action: "APPROVE" | "REJECT" | "DELETE") {
    if (action === "DELETE" && !confirm("Remover comentário definitivamente?")) return;
    let reason: string | undefined;
    if (action === "REJECT") {
      reason = prompt("Motivo da rejeição (opcional):") || undefined;
    }
    start(async () => {
      try {
        await moderateComment(commentId, action, reason);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro na moderação.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {status !== "APPROVED" && (
        <button
          onClick={() => run("APPROVE")}
          disabled={pending}
          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Aprovar
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          onClick={() => run("REJECT")}
          disabled={pending}
          className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          Rejeitar
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => run("DELETE")}
          disabled={pending}
          className="rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 disabled:opacity-50"
        >
          Remover
        </button>
      )}
    </div>
  );
}
