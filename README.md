# 4Nexus Notícias — Portal Editorial (MVP)

Portal público de notícias + painel administrativo com fluxo editorial, moderação de comentários, apoio de IA e base técnica de SEO.

Stack: **Next.js 16** (App Router) · **React 19** · **Tailwind 4** · **Prisma 6 + PostgreSQL 17** · IA multi-provedor (Groq padrão).

Banco: PostgreSQL 17 dedicado (`nexus_portal`) no servidor srv1, acessado via Tailscale. Enums nativos (`PostStatus`, `UserRole`, etc.), `timestamptz` em todas as datas, índices em campos de filtro frequente, e busca full-text nativa (`tsvector` + índice GIN, dicionário português) na tabela `Post`.

## Rodar localmente

```bash
cd portal
npm install
# .env já aponta para o Postgres do srv1 (DATABASE_URL)
npx prisma migrate deploy   # aplica as migrations (schema + full-text search)
npm run db:seed             # popula com dados de demonstração
npm run dev                 # http://localhost:3000
```

## Acessos de demonstração

| Papel | E-mail | Senha |
|---|---|---|
| Admin | admin@4nexus.com.br | Admin@4nexus2026 |
| Editor-chefe | editor@4nexus.com.br | Editor@4nexus2026 |
| Redator | redator@4nexus.com.br | Redator@4nexus2026 |
| Moderador | moderador@4nexus.com.br | Moderador@4nexus2026 |

Painel: `http://localhost:3000/admin` (login em `/login`).

## IA editorial (multi-provedor)

Configure no `.env`:

```env
AI_PROVIDER=groq          # groq | openai | openrouter | deepseek | anthropic | perplexity
AI_API_KEY=sua_chave_aqui
AI_MODEL=                 # vazio = modelo padrão do provedor
# AI_BASE_URL=            # opcional: endpoint custom (qualquer API compatível com OpenAI)
```

- Groq: chave gratuita em https://console.groq.com/keys
- Trocar de provedor = trocar env vars. Zero mudança de código.
- **Regra editorial**: conteúdo gerado por IA nunca publica direto — redator só envia para aprovação; publicação exige ação de Editor/Admin (validação humana).

## Fluxo editorial

```
Redator cria/edita (rascunho) → envia para aprovação → Editor/Admin aprova e publica
IA gera rascunho → marcado "com apoio de IA" → revisão humana obrigatória → publicação
Comentário do leitor → PENDENTE → Moderador aprova/rejeita → aparece no portal
```

Status de notícia: Rascunho · Pendente de aprovação · Publicado · Arquivado · Rejeitado.

## SEO incluído

URLs amigáveis (slug), meta title/description por notícia, Open Graph, JSON-LD `NewsArticle`, `sitemap.xml` automático, `robots.txt`, páginas institucionais (Sobre, Contato, Privacidade, Termos, Política editorial), tempo de leitura, autor identificado, datas de publicação/atualização.

## Limitações conhecidas (MVP)

- **Deploy serverless (Vercel)**: o Postgres do srv1 só é acessível via Tailscale — a Vercel não alcança esse IP sem tunnel/proxy. O preview na Vercel usa dados estáticos de exemplo; a operação editorial real roda local (ou de qualquer máquina na tailnet) contra o Postgres do srv1.
- Upload de imagem: salva em `public/uploads/` no disco local — funciona rodando local, não em serverless.
- Google Analytics / Search Console: estrutura pronta, ativação na Fase 3 (requer domínio oficial).

## Estrutura

```
src/app/(public)/   portal público (home, notícia, categoria, autor, tag, busca, institucionais)
src/app/admin/      painel administrativo (notícias, comentários, categorias, tags, autores, usuários)
src/app/login/      autenticação (JWT em cookie httpOnly)
src/app/api/admin/  upload de imagens
src/lib/            db (Prisma), auth, ai (multi-provedor), utils
prisma/             schema, migrations, seed
public/uploads/     imagens (capas, avatares, uploads)
```
