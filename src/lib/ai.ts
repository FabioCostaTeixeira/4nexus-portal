/**
 * Adaptador de IA multi-provedor (protocolo OpenAI chat/completions).
 * Provedores suportados via env AI_PROVIDER: groq (padrão), openai,
 * openrouter, deepseek, anthropic, perplexity — ou AI_BASE_URL custom.
 * Troca de provedor = trocar env vars, sem mudar código.
 */

const PROVIDER_BASE_URLS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  deepseek: "https://api.deepseek.com",
  anthropic: "https://api.anthropic.com/v1",
  perplexity: "https://api.perplexity.ai",
};

const DEFAULT_MODELS: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  openrouter: "meta-llama/llama-3.3-70b-instruct",
  deepseek: "deepseek-chat",
  anthropic: "claude-haiku-4-5-20251001",
  perplexity: "sonar",
};

export type AiDraftResult = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  metaDescription: string;
  imagePlaceholders: string[];
};

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export function aiProviderInfo() {
  const provider = process.env.AI_PROVIDER || "groq";
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider] || "";
  return { provider, model };
}

async function chat(messages: { role: string; content: string }[]) {
  const provider = process.env.AI_PROVIDER || "groq";
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "IA não configurada. Defina AI_API_KEY no arquivo .env (provedor atual: " +
        provider +
        ")."
    );
  }
  const baseUrl =
    process.env.AI_BASE_URL || PROVIDER_BASE_URLS[provider] || PROVIDER_BASE_URLS.groq;
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider] || DEFAULT_MODELS.groq;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro do provedor de IA (${provider} ${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return content;
}

function buildSystemPrompt(extraImageCount: number): string {
  const imageRule =
    extraImageCount > 0
      ? `- O content deve conter EXATAMENTE ${extraImageCount} marcador(es) de imagem no formato [IMAGEM_2], [IMAGEM_3], etc.
  (a numeração começa em 2 porque a IMAGEM_1 é a capa, exibida separadamente).
  Cada marcador deve ficar sozinho em sua própria linha, posicionado entre
  seções (logo após um bloco de parágrafos, antes do próximo ##), nunca no
  meio de uma frase. Distribua os marcadores ao longo do texto.`
      : `- NUNCA inclua no content seções como "Imagens:", listas de imagens sugeridas,
  placeholders de imagem (tipo [IMAGEM_2]) ou referências a figuras/legendas.
  A imagem de capa é gerada e anexada separadamente pelo sistema — o texto
  deve ser autocontido, sem mencionar imagens.`;

  return `Você é o assistente editorial do portal de notícias da 4Nexus, empresa brasileira de tecnologia e inovação.
Escreva sempre em português do Brasil, com tom jornalístico profissional, claro e original.
Responda SOMENTE com JSON válido, sem markdown ao redor, no formato:
{"title": "...", "summary": "...", "content": "...", "tags": ["...","..."], "metaDescription": "..."}
- title: título jornalístico, máx 80 caracteres.
- summary: resumo de 1-2 frases (máx 200 caracteres).
- content: corpo da notícia em Markdown (400-700 palavras), com subtítulos ##.
- tags: 3 a 6 tags curtas em minúsculas.
- metaDescription: meta description SEO, máx 155 caracteres.
${imageRule}`;
}

/** Detecta se a pauta pede explicitamente mais de uma imagem, e quantas. */
export async function detectExtraImageCount(pauta: string): Promise<number> {
  const raw = await chat([
    {
      role: "system",
      content:
        'Analise o pedido de pauta de notícia e diga quantas imagens ADICIONAIS (além da capa) o usuário pediu explicitamente. Se não mencionar quantidade de imagens, ou pedir só uma (a capa), responda 0. Responda SOMENTE com JSON: {"extraImageCount": 0}',
    },
    { role: "user", content: pauta },
  ]);
  try {
    const parsed = JSON.parse(raw.trim());
    const n = Number(parsed.extraImageCount);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 5) : 0;
  } catch {
    return 0;
  }
}

/** Gera um rascunho completo de notícia a partir de uma pauta. */
export async function generateDraft(pauta: string, extraImageCount = 0): Promise<AiDraftResult> {
  const raw = await chat([
    { role: "system", content: buildSystemPrompt(extraImageCount) },
    { role: "user", content: `Gere um rascunho de notícia sobre a pauta: ${pauta}` },
  ]);
  return parseDraft(raw, extraImageCount);
}

/** Gera um resumo expandido (>= 50 linhas) para revisão humana antes da publicação. */
export async function generateReviewSummary(draft: AiDraftResult): Promise<string> {
  const raw = await chat([
    {
      role: "system",
      content:
        'Você resume uma matéria jornalística para revisão editorial interna (não é o texto final, nem o SEO summary). Escreva em português do Brasil, em texto corrido dividido em parágrafos curtos, cobrindo todos os pontos principais do conteúdo com detalhe suficiente para o revisor aprovar sem precisar ler o texto completo. O resumo deve ter NO MÍNIMO 50 linhas (quebras de linha), sem ser repetitivo — use parágrafos curtos de 1-2 frases cada para atingir esse tamanho de forma natural. Responda SOMENTE com JSON: {"reviewSummary": "..."}',
    },
    {
      role: "user",
      content: `Título: ${draft.title}\n\nConteúdo:\n${draft.content}`,
    },
  ]);
  try {
    const parsed = JSON.parse(raw.trim());
    return String(parsed.reviewSummary || draft.summary);
  } catch {
    return draft.summary;
  }
}

/** Melhora/revisa um texto existente (ortografia, clareza, tom). */
export async function reviewText(texto: string): Promise<string> {
  const raw = await chat([
    {
      role: "system",
      content:
        'Você é revisor editorial. Revise ortografia, gramática e clareza do texto em Markdown, mantendo o sentido. Responda SOMENTE com JSON: {"content": "texto revisado em markdown"}',
    },
    { role: "user", content: texto },
  ]);
  try {
    const parsed = JSON.parse(raw);
    return parsed.content || texto;
  } catch {
    return raw;
  }
}

export type ClassifyPautaResult = {
  category: string | null;
  confidence: "alta" | "média" | "baixa";
  reason?: string;
};

/** Classifica a pauta em uma das categorias ativas do portal, ou recusa se fora de escopo. */
export async function classifyPauta(
  texto: string,
  categorias: string[]
): Promise<ClassifyPautaResult> {
  const raw = await chat([
    {
      role: "system",
      content: `Você classifica pautas de notícia do portal 4Nexus (ES) em uma destas categorias: ${categorias.join(
        ", "
      )}.
Responda SOMENTE com JSON: {"category": "NomeExatoDaCategoria" ou null, "confidence": "alta"|"média"|"baixa", "reason": "motivo breve em português"}.
- category deve ser EXATAMENTE um dos nomes listados acima, ou null se a pauta não se encaixar em nenhuma.
- Se a pauta for vaga mas plausivelmente relacionada a alguma categoria, retorne confidence "baixa" com o melhor palpite.
- Se a pauta for claramente fora de qualquer uma dessas categorias, retorne category null e explique em reason.`,
    },
    { role: "user", content: texto },
  ]);

  try {
    let jsonText = raw.trim();
    const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonText = fence[1].trim();
    const parsed = JSON.parse(jsonText);
    const confidence = ["alta", "média", "baixa"].includes(parsed.confidence)
      ? parsed.confidence
      : "baixa";
    return {
      category: parsed.category ? String(parsed.category) : null,
      confidence,
      reason: parsed.reason ? String(parsed.reason) : undefined,
    };
  } catch {
    return { category: null, confidence: "baixa", reason: "Não foi possível interpretar a pauta." };
  }
}

function parseDraft(raw: string, extraImageCount: number): AiDraftResult {
  let jsonText = raw.trim();
  // Alguns modelos envolvem em ```json ... ```
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonText = fence[1].trim();
  const parsed = JSON.parse(jsonText);
  const content = String(parsed.content || "");

  const foundPlaceholders = [...content.matchAll(/\[IMAGEM_(\d+)\]/g)].map((m) => m[0]);
  const imagePlaceholders =
    extraImageCount > 0
      ? Array.from({ length: extraImageCount }, (_, i) => `[IMAGEM_${i + 2}]`).filter((p) =>
          foundPlaceholders.includes(p)
        )
      : [];

  return {
    title: String(parsed.title || "Sem título"),
    summary: String(parsed.summary || ""),
    content,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    metaDescription: String(parsed.metaDescription || parsed.meta_description || ""),
    imagePlaceholders,
  };
}
