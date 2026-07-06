import { prisma } from "@/lib/db";
import { classifyPauta, generateDraft } from "@/lib/ai";
import { generateOrFetchCoverImage } from "@/lib/ai-image";
import { createPost, publishPostNow, schedulePost, resolveTelegramActor } from "@/lib/posts-service";
import {
  sendMessage,
  sendPhoto,
  answerCallbackQuery,
  buildInlineKeyboard,
  type TelegramUpdate,
} from "@/lib/telegram";

const RESTRICTED_MESSAGE =
  "Este bot é restrito ao administrador do Portal 4Nexus. Fale com a equipe editorial se precisar sugerir uma pauta.";

function isAdmin(chatId: string): boolean {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  return Boolean(adminId) && chatId === adminId;
}

async function getOrCreateConversation(chatId: string) {
  return prisma.telegramConversation.upsert({
    where: { chatId },
    update: {},
    create: { chatId, state: "IDLE" },
  });
}

async function resetConversation(chatId: string) {
  await prisma.telegramConversation.update({
    where: { chatId },
    data: {
      state: "IDLE",
      pautaRaw: null,
      categoryId: null,
      aiDraftId: null,
      postId: null,
      lastBotMessageId: null,
    },
  });
}

/** Ponto de entrada: processa uma mensagem de texto recebida do Telegram. */
export async function handleTextMessage(chatId: string, text: string) {
  if (!isAdmin(chatId)) {
    await sendMessage(chatId, RESTRICTED_MESSAGE);
    return;
  }

  const conversation = await getOrCreateConversation(chatId);

  if (conversation.state === "IDLE") {
    await handlePautaSubmission(chatId, text);
    return;
  }

  if (conversation.state === "AWAITING_CATEGORY") {
    await handlePautaSubmission(chatId, `${conversation.pautaRaw ?? ""}\n${text}`.trim());
    return;
  }

  if (conversation.state === "AWAITING_SCHEDULE") {
    await handleScheduleInput(chatId, text);
    return;
  }

  await sendMessage(
    chatId,
    "Estou processando o passo anterior. Use os botões da última mensagem, ou aguarde."
  );
}

async function handlePautaSubmission(chatId: string, pauta: string) {
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const categoryNames = categories.map((c) => c.name);

  const classification = await classifyPauta(pauta, categoryNames);
  const matched = classification.category
    ? categories.find((c) => c.name.toLowerCase() === classification.category!.toLowerCase())
    : null;

  if (!matched) {
    await prisma.telegramConversation.update({
      where: { chatId },
      data: { state: "IDLE", pautaRaw: null },
    });
    await sendMessage(
      chatId,
      `Não consegui identificar essa pauta dentro das nossas categorias. O portal cobre apenas: ${categoryNames.join(
        ", "
      )}.\n\nEnvie novamente descrevendo a pauta com mais contexto.`
    );
    return;
  }

  if (classification.confidence === "baixa") {
    await prisma.telegramConversation.update({
      where: { chatId },
      data: { state: "AWAITING_CATEGORY", pautaRaw: pauta, categoryId: matched.id },
    });
    await sendMessage(
      chatId,
      `Essa pauta parece ser sobre *${matched.name}*, mas não tenho certeza. Confirma ou me diga a categoria certa entre: ${categoryNames.join(
        ", "
      )}.`
    );
    return;
  }

  await prisma.telegramConversation.update({
    where: { chatId },
    data: { state: "GENERATING", pautaRaw: pauta, categoryId: matched.id },
  });
  await sendMessage(chatId, `Gerando matéria sobre *${matched.name}*... isso pode levar até 2 minutos.`);
  await generateAndPresentDraft(chatId, pauta, matched.id);
}

async function generateAndPresentDraft(chatId: string, pauta: string, categoryId: string) {
  try {
    const draft = await generateDraft(pauta);
    const coverImageUrl = await generateOrFetchCoverImage(`${draft.title}. ${draft.summary}`);

    const aiDraft = await prisma.aiDraft.create({
      data: {
        prompt: pauta,
        generatedTitle: draft.title,
        generatedContent: draft.content,
        generatedSummary: draft.summary,
        generatedTags: draft.tags.join(", "),
        generatedMetaDescription: draft.metaDescription,
        coverImageUrl,
        origin: "TELEGRAM",
        status: "GENERATED",
      },
    });

    await prisma.telegramConversation.update({
      where: { chatId },
      data: { state: "AWAITING_APPROVAL", aiDraftId: aiDraft.id, categoryId },
    });

    const caption = `*${draft.title}*\n\n${draft.summary}\n\n_Tags: ${draft.tags.join(", ")}_`;
    const keyboard = buildInlineKeyboard([
      [
        { text: "✅ Aprovar", data: `approve:${aiDraft.id}` },
        { text: "❌ Rejeitar", data: `reject:${aiDraft.id}` },
      ],
    ]);

    if (coverImageUrl) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      await sendPhoto(chatId, `${siteUrl}${coverImageUrl}`, { caption, replyMarkup: keyboard });
    } else {
      await sendMessage(chatId, `${caption}\n\n_(sem imagem de capa)_`, { replyMarkup: keyboard });
    }
  } catch (e) {
    await resetConversation(chatId);
    await sendMessage(
      chatId,
      `Erro ao gerar a matéria: ${e instanceof Error ? e.message : "erro desconhecido"}.`
    );
  }
}

async function handleScheduleInput(chatId: string, text: string) {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) {
    await sendMessage(chatId, "Formato inválido. Use *DD/MM/AAAA HH:mm*, por exemplo: 25/12/2026 14:30.");
    return;
  }
  const [, day, month, year, hour, minute] = match;
  const when = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    await sendMessage(chatId, "A data precisa ser válida e estar no futuro. Tente novamente.");
    return;
  }

  const conversation = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!conversation?.postId) {
    await sendMessage(chatId, "Não há matéria aguardando agendamento.");
    return;
  }

  try {
    const actor = await resolveTelegramActor();
    await schedulePost(conversation.postId, actor, when);
    await resetConversation(chatId);
    await sendMessage(chatId, `Matéria agendada para ${text.trim()}. ✅`);
  } catch (e) {
    await sendMessage(chatId, `Erro ao agendar: ${e instanceof Error ? e.message : "erro desconhecido"}.`);
  }
}

/** Ponto de entrada: processa um clique em botão inline (callback_query). */
export async function handleCallbackQuery(update: TelegramUpdate) {
  const cq = update.callback_query;
  if (!cq) return;

  await answerCallbackQuery(cq.id);

  const chatId = String(cq.message?.chat.id ?? "");
  const data = cq.data ?? "";
  if (!chatId) return;

  if (!isAdmin(chatId)) {
    await sendMessage(chatId, RESTRICTED_MESSAGE);
    return;
  }

  const [action, param] = data.split(":");

  if (action === "approve") {
    await handleApprove(chatId, param);
  } else if (action === "reject") {
    await handleReject(chatId, param);
  } else if (action === "author") {
    await handleAuthorChosen(chatId, param);
  } else if (action === "publish_now") {
    await handlePublishNow(chatId);
  } else if (action === "schedule") {
    await handleScheduleRequest(chatId);
  }
}

async function handleApprove(chatId: string, aiDraftId: string) {
  const conversation = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!conversation || conversation.aiDraftId !== aiDraftId || conversation.state !== "AWAITING_APPROVAL") {
    await sendMessage(chatId, "Essa aprovação já foi processada ou expirou.");
    return;
  }

  const authors = await prisma.author.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  if (authors.length === 0) {
    await sendMessage(chatId, "Nenhum autor ativo cadastrado no portal. Cadastre um autor antes de publicar.");
    return;
  }

  await prisma.telegramConversation.update({ where: { chatId }, data: { state: "AWAITING_AUTHOR" } });

  const keyboard = buildInlineKeyboard(
    authors.map((a) => [{ text: a.name, data: `author:${a.id}` }])
  );
  await sendMessage(chatId, "Aprovado! Qual autor deve assinar a matéria?", { replyMarkup: keyboard });
}

async function handleReject(chatId: string, aiDraftId: string) {
  await prisma.aiDraft.update({ where: { id: aiDraftId }, data: { status: "DISCARDED" } }).catch(() => {});
  await resetConversation(chatId);
  await sendMessage(chatId, "Rascunho rejeitado e descartado.");
}

async function handleAuthorChosen(chatId: string, authorId: string) {
  const conversation = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!conversation?.aiDraftId || conversation.state !== "AWAITING_AUTHOR" || !conversation.categoryId) {
    await sendMessage(chatId, "Não há aprovação pendente para esse autor.");
    return;
  }

  const aiDraft = await prisma.aiDraft.findUnique({ where: { id: conversation.aiDraftId } });
  if (!aiDraft) {
    await sendMessage(chatId, "Rascunho não encontrado.");
    return;
  }

  try {
    const actor = await resolveTelegramActor();
    const post = await createPost({
      actor,
      title: aiDraft.generatedTitle ?? "Sem título",
      content: aiDraft.generatedContent ?? "",
      summary: aiDraft.generatedSummary,
      categoryId: conversation.categoryId,
      authorId,
      coverImageUrl: aiDraft.coverImageUrl,
      metaTitle: aiDraft.generatedTitle,
      metaDescription: aiDraft.generatedMetaDescription,
      generatedByAi: true,
      status: "PENDING",
      tagIds: [],
    });

    await prisma.aiDraft.update({ where: { id: aiDraft.id }, data: { status: "USED" } });
    await prisma.telegramConversation.update({
      where: { chatId },
      data: { state: "AWAITING_SCHEDULE", postId: post.id },
    });

    const keyboard = buildInlineKeyboard([
      [
        { text: "🚀 Publicar agora", data: "publish_now" },
        { text: "🗓️ Agendar", data: "schedule" },
      ],
    ]);
    await sendMessage(chatId, "Autor definido. Publicar agora ou agendar?", { replyMarkup: keyboard });
  } catch (e) {
    await sendMessage(chatId, `Erro ao criar a matéria: ${e instanceof Error ? e.message : "erro desconhecido"}.`);
  }
}

async function handlePublishNow(chatId: string) {
  const conversation = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!conversation?.postId || conversation.state !== "AWAITING_SCHEDULE") {
    await sendMessage(chatId, "Não há matéria aguardando publicação.");
    return;
  }

  try {
    const actor = await resolveTelegramActor();
    await publishPostNow(conversation.postId, actor);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const post = await prisma.post.findUnique({ where: { id: conversation.postId } });
    await resetConversation(chatId);
    await sendMessage(chatId, `Matéria publicada! ${siteUrl}/noticia/${post?.slug ?? ""}`);
  } catch (e) {
    await sendMessage(chatId, `Erro ao publicar: ${e instanceof Error ? e.message : "erro desconhecido"}.`);
  }
}

async function handleScheduleRequest(chatId: string) {
  const conversation = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!conversation?.postId || conversation.state !== "AWAITING_SCHEDULE") {
    await sendMessage(chatId, "Não há matéria aguardando agendamento.");
    return;
  }
  await sendMessage(chatId, "Envie a data e hora no formato *DD/MM/AAAA HH:mm* (ex: 25/12/2026 14:30).");
}
