import type { Metadata } from "next";
import InstitutionalPage from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Sobre o Portal 4Nexus",
  description:
    "Conheça o Portal 4Nexus: a sua nova casa de notícias do Espírito Santo.",
};

export default function SobrePage() {
  return (
    <InstitutionalPage title="Sobre o Portal 4Nexus">
      <p>
        O <strong>Portal 4Nexus</strong> é a sua nova casa de notícias do{" "}
        <strong>Espírito Santo</strong>. Nascemos para cobrir, com profundidade
        e linguagem direta, os setores que movem a economia e a vida capixaba:
        agronegócio, rochas ornamentais, indústria metalmecânica, política,
        esporte, saúde, concursos e tecnologia.
      </p>
      <h2>Quem somos</h2>
      <p>
        O portal é uma iniciativa da <strong>4Nexus</strong>, empresa capixaba
        de tecnologia e dados. Unimos jornalismo com inteligência de dados para
        entregar informação que ajuda o leitor a decidir — do produtor rural no
        norte do estado ao concurseiro da Grande Vitória.
      </p>
      <h2>O que nos guia</h2>
      <ul>
        <li><strong>ES em primeiro lugar</strong>: pauta local, apuração local.</li>
        <li><strong>Originalidade</strong>: conteúdo próprio, com dados e fontes.</li>
        <li><strong>Responsabilidade</strong>: uso de IA sempre com revisão humana.</li>
        <li><strong>Clareza</strong>: notícia que se entende de primeira.</li>
      </ul>
      <p>
        Para falar com a nossa redação, visite a página de{" "}
        <a href="/contato">contato</a>.
      </p>
    </InstitutionalPage>
  );
}
