"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { savePost, aiGenerateDraft, aiReviewContent, type SaveState } from "./actions";

type Option = { id: string; name: string };
type TagOption = { id: string; name: string; slug: string };

export type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageUrl: string;
  categoryId: string;
  authorId: string;
  metaTitle: string;
  metaDescription: string;
  featured: boolean;
  generatedByAi: boolean;
  status: string;
  tagIds: string[];
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING: "Pendente de aprovação",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
  REJECTED: "Rejeitado",
};

function localSlugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const initialState: SaveState = { message: "", error: false };

export default function PostForm({
  post,
  categories,
  authors,
  tags,
  allowedStatuses,
  aiEnabled,
  aiProvider,
  saved,
}: {
  post: PostFormData;
  categories: Option[];
  authors: Option[];
  tags: TagOption[];
  allowedStatuses: string[];
  aiEnabled: boolean;
  aiProvider: string;
  saved?: boolean;
}) {
  const [state, formAction, pending] = useActionState(savePost, initialState);

  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.id));
  const [summary, setSummary] = useState(post.summary);
  const [content, setContent] = useState(post.content);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle);
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl);
  const [generatedByAi, setGeneratedByAi] = useState(post.generatedByAi);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(post.tagIds));

  const [pauta, setPauta] = useState("");
  const [aiBusy, startAi] = useTransition();
  const [aiMessage, setAiMessage] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(localSlugify(v));
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  function runAiDraft() {
    setAiMessage("");
    startAi(async () => {
      const result = await aiGenerateDraft(pauta);
      if (!result.ok) {
        setAiMessage(result.error);
        return;
      }
      setTitle(result.title);
      if (!slugTouched) setSlug(localSlugify(result.title));
      setSummary(result.summary);
      setContent(result.content);
      setMetaDescription(result.metaDescription);
      setGeneratedByAi(true);
      // marca tags existentes que a IA sugeriu
      const suggested = result.tags.map((t) => localSlugify(t));
      const matched = tags.filter((t) => suggested.includes(t.slug)).map((t) => t.id);
      if (matched.length) setSelectedTags(new Set(matched));
      setAiMessage(
        "Rascunho gerado. Revise o conteúdo — publicação exige aprovação humana." +
          (result.tags.length
            ? ` Tags sugeridas: ${result.tags.join(", ")}.`
            : "")
      );
    });
  }

  function runAiReview() {
    setAiMessage("");
    startAi(async () => {
      const result = await aiReviewContent(content);
      if (!result.ok) {
        setAiMessage(result.error || "Erro ao revisar.");
        return;
      }
      setContent(result.content || content);
      setGeneratedByAi(true);
      setAiMessage("Texto revisado pela IA. Confira as alterações antes de salvar.");
    });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg("Enviando…");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload.");
      setCoverImageUrl(data.url);
      setUploadMsg("Imagem enviada.");
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Falha no upload.");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none bg-white";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="generatedByAi" value={String(generatedByAi)} />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl} />

      {/* Coluna principal */}
      <div className="lg:col-span-2 space-y-5">
        {(saved || state.message) && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              state.error
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {state.message || "Notícia salva com sucesso."}
          </p>
        )}

        <div>
          <label className={labelCls}>Título *</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputCls}
            placeholder="Título da notícia"
          />
        </div>

        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className={inputCls}
            placeholder="slug-da-noticia"
          />
          <p className="mt-1 text-xs text-slate-400">/noticia/{slug || "…"}</p>
        </div>

        <div>
          <label className={labelCls}>Resumo</label>
          <textarea
            name="summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={inputCls}
            placeholder="Resumo curto exibido nos cards e na abertura da notícia"
          />
        </div>

        <div>
          <label className={labelCls}>
            Conteúdo * <span className="font-normal text-slate-400">(Markdown suportado: ## subtítulos, **negrito**, listas)</span>
          </label>
          <textarea
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputCls} font-mono text-[13px] min-h-96`}
            placeholder="Escreva o conteúdo da notícia em Markdown…"
          />
        </div>

        {/* Painel IA */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-brand-900">
              ✦ Assistente editorial de IA
            </h3>
            <span className="text-xs text-slate-500">provedor: {aiProvider}</span>
          </div>
          {!aiEnabled ? (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              IA não configurada — defina <code className="font-mono">AI_API_KEY</code> no
              arquivo <code className="font-mono">.env</code> (provedor atual: {aiProvider}).
              Chave gratuita: console.groq.com/keys
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={pauta}
                  onChange={(e) => setPauta(e.target.value)}
                  className={inputCls}
                  placeholder="Pauta — ex.: impacto da IA no varejo brasileiro"
                />
                <button
                  type="button"
                  onClick={runAiDraft}
                  disabled={aiBusy || !pauta.trim()}
                  className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {aiBusy ? "Gerando…" : "Gerar rascunho"}
                </button>
                <button
                  type="button"
                  onClick={runAiReview}
                  disabled={aiBusy || !content.trim()}
                  className="shrink-0 rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                >
                  Revisar texto
                </button>
              </div>
              {aiMessage && (
                <p className="mt-2 text-xs text-slate-600">{aiMessage}</p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                Conteúdo gerado por IA entra como &quot;gerado com apoio de IA&quot; e exige
                aprovação humana antes de publicar.
              </p>
            </>
          )}
        </div>

        {/* SEO */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">SEO</h3>
          <div>
            <label className={labelCls}>Meta título</label>
            <input
              name="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputCls}
              placeholder="Se vazio, usa o título da notícia"
            />
          </div>
          <div>
            <label className={labelCls}>
              Meta description{" "}
              <span
                className={`font-normal ${
                  metaDescription.length > 155 ? "text-red-500" : "text-slate-400"
                }`}
              >
                ({metaDescription.length}/155)
              </span>
            </label>
            <textarea
              name="metaDescription"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={inputCls}
              placeholder="Descrição exibida no Google (ideal até 155 caracteres)"
            />
          </div>
        </div>
      </div>

      {/* Coluna lateral */}
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Publicação</h3>
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" defaultValue={post.status} className={inputCls}>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={post.featured}
              className="h-4 w-4 rounded border-slate-300"
            />
            Destaque na home
          </label>
          {generatedByAi && (
            <p className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
              ✦ Conteúdo com apoio de IA — exige revisão humana
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            {post.id && (
              <Link
                href={`/admin/noticias/${post.id}/preview`}
                target="_blank"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Pré-visualizar
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Organização</h3>
          <div>
            <label className={labelCls}>Categoria *</label>
            <select name="categoryId" required defaultValue={post.categoryId} className={inputCls}>
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Autor *</label>
            <select name="authorId" required defaultValue={post.authorId} className={inputCls}>
              <option value="">Selecione…</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tags</label>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1">
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="tags"
                    value={t.id}
                    checked={selectedTags.has(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Imagem destacada</h3>
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="Capa" className="w-full rounded-lg border border-slate-100" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={onUpload}
            className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-brand-700"
          />
          {uploadMsg && <p className="text-xs text-slate-500">{uploadMsg}</p>}
          <div>
            <label className={labelCls}>ou URL da imagem</label>
            <input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className={inputCls}
              placeholder="/uploads/… ou https://…"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
