import Link from "next/link";
import type { CommentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, COMMENT_STATUS } from "@/lib/utils";
import ModerationButtons from "./ModerationButtons";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function ComentariosPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireUser(["ADMIN", "EDITOR", "MODERADOR"]);
  const sp = await props.searchParams;
  const status = (sp.status && sp.status in COMMENT_STATUS ? sp.status : "PENDING") as CommentStatus;

  const comments = await prisma.comment.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { post: { select: { title: true, slug: true } } },
  });

  const counts = await prisma.comment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Moderação de comentários</h1>

      <div className="flex gap-2">
        {Object.entries(COMMENT_STATUS).map(([k, label]) => (
          <Link
            key={k}
            href={`/admin/comentarios?status=${k}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
              status === k
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {label} ({countMap[k] ?? 0})
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            Nenhum comentário {COMMENT_STATUS[status as keyof typeof COMMENT_STATUS].toLowerCase()}.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">{c.userName}</span>{" "}
                  <span className="text-xs text-slate-400">&lt;{c.userEmail}&gt;</span>{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                    {COMMENT_STATUS[c.status as keyof typeof COMMENT_STATUS]}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line">{c.content}</p>
                <p className="mt-2 text-xs text-slate-400">
                  em{" "}
                  <Link
                    href={`/noticia/${c.post.slug}`}
                    target="_blank"
                    className="italic text-brand-700 hover:underline"
                  >
                    {c.post.title}
                  </Link>{" "}
                  · {formatDateTime(c.createdAt)}
                  {c.rejectedReason && c.status === "REJECTED" && (
                    <> · motivo: {c.rejectedReason}</>
                  )}
                </p>
              </div>
              <ModerationButtons
                commentId={c.id}
                status={c.status}
                isAdmin={session.role === "ADMIN"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
