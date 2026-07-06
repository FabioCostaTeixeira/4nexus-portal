import type { Metadata } from "next";
import InstitutionalPage from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Condições de uso do portal de notícias da 4Nexus.",
};

export default function TermosDeUsoPage() {
  return (
    <InstitutionalPage title="Termos de uso">
      <p>
        Ao acessar este portal, você concorda com as condições abaixo.
      </p>
      <h2>Conteúdo</h2>
      <ul>
        <li>
          O conteúdo publicado tem caráter informativo e reflete o entendimento
          dos autores na data de publicação.
        </li>
        <li>
          É permitido citar trechos com link e crédito ao portal. A reprodução
          integral sem autorização prévia não é permitida.
        </li>
      </ul>
      <h2>Comentários</h2>
      <ul>
        <li>O visitante é responsável pelo conteúdo que envia.</li>
        <li>
          Comentários passam por moderação e podem ser recusados quando
          contiverem ofensas, spam, links suspeitos ou conteúdo ilegal.
        </li>
      </ul>
      <h2>Uso indevido</h2>
      <p>
        É proibido utilizar o portal para fins ilícitos, tentar acessar áreas
        restritas sem autorização ou interferir no funcionamento do serviço.
      </p>
      <h2>Alterações</h2>
      <p>
        Estes termos podem ser atualizados a qualquer momento. O uso continuado
        do portal após alterações implica concordância com a versão vigente.
      </p>
      <p>Última atualização: julho de 2026.</p>
    </InstitutionalPage>
  );
}
