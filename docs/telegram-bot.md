# Bot do Telegram — Redator IA do Portal 4Nexus

Fluxo: admin manda a pauta em português no Telegram → IA classifica a categoria e gera a
matéria (texto + imagem de capa) → admin aprova, escolhe o autor e decide publicar
imediatamente ou agendar → publicação automática quando chega a hora.

## 1. Pré-requisitos

- `TELEGRAM_BOT_TOKEN` já criado via [@BotFather](https://t.me/BotFather) (`/newbot`).
- Um `User` com role `ADMIN` no banco cujo e-mail está em `TELEGRAM_ADMIN_USER_EMAIL` (`.env`).
- Codex CLI instalado e autenticado no srv1 (`codex exec` funcionando sem prompt de login) —
  usado para gerar a imagem de capa via `image_gen`. Sem isso, o bot cai automaticamente no
  fallback Pexels (se `PEXELS_API_KEY` estiver configurado) ou segue sem imagem.
- App rodando publicamente via o Cloudflare tunnel já existente (porta 3001).

## 2. Variáveis de ambiente (`.env` no srv1)

```
TELEGRAM_BOT_TOKEN=<token do BotFather>
TELEGRAM_ADMIN_ID=<seu chat id numérico>
TELEGRAM_WEBHOOK_SECRET=<string aleatória>
TELEGRAM_ADMIN_USER_EMAIL=admin@4nexus.com.br
PEXELS_API_KEY=<opcional, fallback de imagem>
INTERNAL_CRON_SECRET=<string aleatória>
```

### Como descobrir seu `TELEGRAM_ADMIN_ID`

Mande qualquer mensagem para o bot depois de configurar o webhook (passo 3). A primeira
mensagem de um chat não autorizado é ignorada (recebe a mensagem de "bot restrito"), mas o
`chat.id` aparece no body do update recebido — mais simples: use
`https://api.telegram.org/bot<TOKEN>/getUpdates` no navegador logo após mandar a mensagem
(antes de configurar o webhook) e leia `message.chat.id` do JSON retornado.

## 3. Registrar o webhook no Telegram

Depois que o app estiver rodando publicamente (URL do Cloudflare tunnel, ex.
`https://xxxx.trycloudflare.com`):

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://xxxx.trycloudflare.com/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Para conferir se o webhook está ativo:
```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

**Atenção**: a URL do trycloudflare muda a cada restart do tunnel (ver `C:\apps\tunnel.log`).
Sempre que o tunnel reiniciar, repita o `setWebhook` com a nova URL.

## 4. Scheduled Task para publicação agendada (srv1)

Cria uma tarefa do Windows que chama o endpoint interno a cada 2 minutos, mesmo padrão das
tarefas `Portal4Nexus-App`/`Portal4Nexus-Tunnel` já existentes:

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument `
  '-NoProfile -Command "Invoke-WebRequest -Method POST -Uri http://127.0.0.1:3001/api/internal/cron/publish-scheduled -Headers @{ ''X-Internal-Cron-Secret'' = ''<INTERNAL_CRON_SECRET>'' }"'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 2) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "Portal4Nexus-CronScheduled" -Action $action -Trigger $trigger -RunLevel Highest
```

## 5. Fluxo de uso

1. Admin manda a pauta em texto livre pelo Telegram (ex.: "produtores de café no ES tiveram
   safra recorde este ano").
2. Bot classifica a categoria; se a pauta for ambígua, pergunta para confirmar; se for
   claramente fora das 10 categorias do portal, recusa.
3. Bot gera o rascunho (título, resumo, conteúdo, tags) + imagem de capa, e envia para
   aprovação com botões **Aprovar**/**Rejeitar**.
4. Ao aprovar, bot pergunta qual autor deve assinar a matéria (lista os autores ativos).
5. Escolhido o autor, a matéria é criada com status `PENDING` e o bot pergunta:
   **Publicar agora** ou **Agendar**.
6. Se agendar, o admin envia a data/hora no formato `DD/MM/AAAA HH:mm`. O status vira
   `SCHEDULED` e a Scheduled Task do passo 4 publica automaticamente quando chega a hora,
   notificando o admin no Telegram.

Qualquer chat que não seja o `TELEGRAM_ADMIN_ID` recebe apenas uma mensagem fixa informando
que o bot é restrito — nenhuma pauta de terceiros é processada ou persistida.
