import type { Metadata } from "next";
import InstitutionalPage from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe da 4Nexus.",
};

export default function ContatoPage() {
  return (
    <InstitutionalPage title="Contato">
      <p>
        Tem uma pauta, dúvida, sugestão ou proposta de parceria? Fale com a
        nossa equipe pelo e-mail{" "}
        <a href="mailto:contato@4nexus.com.br">contato@4nexus.com.br</a> ou use
        o formulário abaixo.
      </p>
      <form className="not-prose mt-8 space-y-4 rounded-xl border border-line bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Nome</label>
            <input
              type="text"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">E-mail</label>
            <input
              type="email"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              placeholder="voce@empresa.com.br"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Assunto</label>
          <input
            type="text"
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            placeholder="Sobre o que você quer falar?"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1">Mensagem</label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            placeholder="Escreva sua mensagem…"
          />
        </div>
        <a
          href="mailto:contato@4nexus.com.br"
          className="inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-surface-3 hover:bg-brand-400"
        >
          Enviar por e-mail
        </a>
        <p className="text-xs text-ink-faint">
          O envio direto pelo site será habilitado em breve. Por enquanto, o
          botão abre seu aplicativo de e-mail.
        </p>
      </form>
    </InstitutionalPage>
  );
}
