import { NextResponse } from "next/server";
import { publishDuePosts, resolveTelegramActor } from "@/lib/posts-service";
import { sendMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-cron-secret");
  if (!secret || secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const actor = await resolveTelegramActor();
  const published = await publishDuePosts(actor);

  const adminId = process.env.TELEGRAM_ADMIN_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (adminId) {
    for (const post of published) {
      await sendMessage(
        adminId,
        `Matéria publicada conforme agendado: *${post.title}*\n${siteUrl}/noticia/${post.slug}`
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, published: published.length });
}
