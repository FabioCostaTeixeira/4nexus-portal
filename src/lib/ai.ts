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

const SYSTEM_PROMPT = `Você é o assistente editorial do portal de notícias da 4Nexus, empresa brasileira de tecnologia e inovação.
Escreva sempre em português do Brasil, com tom jornalístico profissional, claro e original.
Responda SOMENTE com JSON válido, sem markdown ao redor, no formato:
{"title": "...", "summary": "...", "content": "...", "tags": ["...","..."], "metaDescription": "..."}
- title: título jornalístico, máx 80 caracteres.
- summary: resumo de 1-2 frases (máx 200 caracteres).
- content: corpo da notícia em Markdown (400-700 palavras), com subtítulos ##.
- tags: 3 a 6 tags curtas em minúsculas.
- metaDescription: meta description SEO, máx 155 caracteres.`;

/** Gera um rascunho completo de notícia a partir de uma pauta. */
export async function generateDraft(pauta: string): Promise<AiDraftResult> {
  const raw = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Gere um rascunho de notícia sobre a pauta: ${pauta}` },
  ]);
  return parseDraft(raw);
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

function parseDraft(raw: string): AiDraftResult {
  let jsonText = raw.trim();
  // Alguns modelos envolvem em ```json ... ```
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonText = fence[1].trim();
  const parsed = JSON.parse(jsonText);
  return {
    title: String(parsed.title || "Sem título"),
    summary: String(parsed.summary || ""),
    content: String(parsed.content || ""),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    metaDescription: String(parsed.metaDescription || parsed.meta_description || ""),
  };
}
