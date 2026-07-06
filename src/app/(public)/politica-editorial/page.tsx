import type { Metadata } from "next";
import InstitutionalPage from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Política editorial",
  description:
    "Como o portal 4Nexus produz, revisa e publica conteúdo — incluindo o uso responsável de IA.",
};

export default function PoliticaEditorialPage() {
  return (
    <InstitutionalPage title="Política editorial">
      <p>
        Este portal publica conteúdo original sobre tecnologia, inovação,
        inteligência artificial e mercado. Nossa produção segue princípios
        claros de responsabilidade editorial.
      </p>
      <h2>Produção e revisão</h2>
      <ul>
        <li>Todo conteúdo passa por revisão editorial antes da publicação.</li>
        <li>Notícias têm autor identificado, data de publicação e, quando houver, data de atualização.</li>
        <li>Correções relevantes são registradas na própria matéria.</li>
      </ul>
      <h2>Uso de inteligência artificial</h2>
      <p>
        Utilizamos IA como apoio editorial: sugestão de pautas, rascunhos,
        títulos, resumos e revisão de texto. <strong>Nenhum conteúdo gerado
        com apoio de IA é publicado sem validação humana.</strong> Rascunhos
        gerados por IA entram obrigatoriamente em fila de aprovação e só são
        publicados após revisão e aprovação de um editor. Matérias produzidas
        com apoio de IA exibem selo indicativo.
      </p>
      <h2>Comentários</h2>
      <p>
        Os comentários dos leitores são bem-vindos e passam por{" "}
        <strong>moderação obrigatória</strong> antes de aparecer no portal.
        Não publicamos comentários ofensivos, discriminatórios, spam ou com
        links suspeitos. Comentários rejeitados permanecem registrados
        internamente para fins de auditoria.
      </p>
      <h2>Fontes e originalidade</h2>
      <ul>
        <li>Não reproduzimos conteúdo de terceiros sem autorização e crédito.</li>
        <li>Informações de mercado citam fonte sempre que possível.</li>
        <li>Opiniões assinadas refletem a visão de seus autores.</li>
      </ul>
      <p>
        Dúvidas ou pedidos de correção: <a href="/contato">fale conosco</a>.
      </p>
    </InstitutionalPage>
  );
}
