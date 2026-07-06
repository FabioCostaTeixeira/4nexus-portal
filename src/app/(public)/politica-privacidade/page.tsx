import type { Metadata } from "next";
import InstitutionalPage from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o portal 4Nexus trata os dados dos visitantes.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <InstitutionalPage title="Política de privacidade">
      <p>
        A 4Nexus respeita a sua privacidade. Esta política descreve, de forma
        simples, quais dados coletamos neste portal e como eles são usados.
      </p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Comentários</strong>: nome, e-mail, conteúdo do comentário e
          data/hora de envio. O e-mail não é exibido publicamente.
        </li>
        <li>
          <strong>Métricas de audiência</strong>: dados agregados e anônimos de
          navegação (páginas visitadas, origem do acesso), quando ferramentas de
          analytics estiverem ativas.
        </li>
      </ul>
      <h2>Como usamos</h2>
      <ul>
        <li>Moderar e publicar comentários.</li>
        <li>Entender a audiência e melhorar o conteúdo.</li>
        <li>Cumprir obrigações legais, quando aplicável.</li>
      </ul>
      <h2>Compartilhamento</h2>
      <p>
        Não vendemos nem compartilhamos dados pessoais com terceiros para fins
        comerciais. Dados podem ser processados por serviços de infraestrutura
        contratados (hospedagem, analytics) apenas para operação do portal.
      </p>
      <h2>Seus direitos (LGPD)</h2>
      <p>
        Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você
        pode solicitar acesso, correção ou exclusão dos seus dados pessoais.
        Para exercer seus direitos, entre em contato pelo e-mail{" "}
        <a href="mailto:contato@4nexus.com.br">contato@4nexus.com.br</a>.
      </p>
      <p>Esta política pode ser atualizada. Última atualização: julho de 2026.</p>
    </InstitutionalPage>
  );
}
