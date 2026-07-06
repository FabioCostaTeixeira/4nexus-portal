import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/lib/telegram";
import { handleTextMessage, handleCallbackQuery } from "@/lib/telegram-conversation";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;

  try {
    if (update.callback_query) {
      await handleCallbackQuery(update);
    } else if (update.message?.text) {
      const chatId = String(update.message.chat.id);
      await handleTextMessage(chatId, update.message.text);
    }
  } catch (e) {
    console.error("Erro ao processar update do Telegram:", e);
  }

  // Sempre 200: o Telegram reentrega updates se não receber 200 a tempo.
  return NextResponse.json({ ok: true });
}
