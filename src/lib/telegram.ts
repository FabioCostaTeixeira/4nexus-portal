/** Wrapper fetch puro para a Telegram Bot API (sem lib externa). */

export type InlineKeyboard = { text: string; data: string }[][];

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN não configurado.");
  return `https://api.telegram.org/bot${token}/${method}`;
}

function toReplyMarkup(keyboard?: InlineKeyboard) {
  if (!keyboard) return undefined;
  return {
    inline_keyboard: keyboard.map((row) => row.map((btn) => ({ text: btn.text, callback_data: btn.data }))),
  };
}

export function buildInlineKeyboard(rows: InlineKeyboard): InlineKeyboard {
  return rows;
}

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API erro (${method} ${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function sendMessage(
  chatId: string,
  text: string,
  opts?: { replyMarkup?: InlineKeyboard }
) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: toReplyMarkup(opts?.replyMarkup),
  });
}

export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  opts?: { caption?: string; replyMarkup?: InlineKeyboard }
) {
  return call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption: opts?.caption,
    parse_mode: "Markdown",
    reply_markup: toReplyMarkup(opts?.replyMarkup),
  });
}

export async function editMessageReplyMarkup(
  chatId: string,
  messageId: number,
  replyMarkup?: InlineKeyboard
) {
  return call("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: toReplyMarkup(replyMarkup),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, opts?: { text?: string }) {
  return call("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: opts?.text,
  });
}

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
};
