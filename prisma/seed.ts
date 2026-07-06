import { PrismaClient, PostStatus, SourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Datas fixas — junho de 2026
function june(day: number, hour = 9) {
  return new Date(2026, 5, day, hour, 15, 0);
}

function readingTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

async function main() {
  console.log("Seed: limpando dados...");
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.aiDraft.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seed: usuários...");
  const [admin, editor, redator, moderador] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Fabio Costa",
        email: "admin@4nexus.com.br",
        passwordHash: await bcrypt.hash("Admin@4nexus2026", 10),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Mariana Lopes",
        email: "editor@4nexus.com.br",
        passwordHash: await bcrypt.hash("Editor@4nexus2026", 10),
        role: "EDITOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ricardo Alves",
        email: "redator@4nexus.com.br",
        passwordHash: await bcrypt.hash("Redator@4nexus2026", 10),
        role: "REDATOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Paula Mendes",
        email: "moderador@4nexus.com.br",
        passwordHash: await bcrypt.hash("Moderador@4nexus2026", 10),
        role: "MODERADOR",
      },
    }),
  ]);

  console.log("Seed: autores...");
  const autorFabio = await prisma.author.create({
    data: {
      name: "Fabio Costa",
      slug: "fabio-costa",
      bio: "Fundador da 4Nexus. Cobre economia, tecnologia e os setores produtivos do Espírito Santo.",
      avatarUrl: "/uploads/avatar-1.svg",
      userId: admin.id,
    },
  });
  const autorMariana = await prisma.author.create({
    data: {
      name: "Mariana Lopes",
      slug: "mariana-lopes",
      bio: "Editora-chefe do Portal 4Nexus. Jornalista capixaba com 12 anos de cobertura política e econômica no ES.",
      avatarUrl: "/uploads/avatar-2.svg",
      userId: editor.id,
    },
  });
  const autorRicardo = await prisma.author.create({
    data: {
      name: "Ricardo Alves",
      slug: "ricardo-alves",
      bio: "Repórter de campo. Agro, esporte e as histórias do interior do Espírito Santo.",
      avatarUrl: "/uploads/avatar-3.svg",
      userId: redator.id,
    },
  });

  console.log("Seed: categorias do portal...");
  const categorias = [
    ["Agro", "agro", "Agronegócio capixaba: café, pimenta, fruticultura e pecuária."],
    ["Pedras", "pedras", "Mármore, granito e rochas ornamentais — o setor que projeta o ES no mundo."],
    ["Maçonaria", "maconaria", "Notícias e eventos das lojas e potências maçônicas no Espírito Santo."],
    ["RH", "rh", "Mercado de trabalho, gestão de pessoas e carreiras no ES."],
    ["Metal", "metal", "Indústria metalmecânica, siderurgia e mineração capixaba."],
    ["Política", "politica", "Política capixaba: Assembleia, prefeituras, governo do estado e Brasília."],
    ["Esporte", "esporte", "O esporte capixaba: futebol, vôlei, atletismo e base."],
    ["Saúde", "saude", "Saúde pública e privada no Espírito Santo."],
    ["Concursos", "concursos", "Concursos públicos e processos seletivos no ES."],
    ["Tecnologia", "tecnologia", "Inovação, startups e tecnologia no ecossistema capixaba."],
  ] as const;

  const cats: Record<string, { id: string }> = {};
  for (const [name, slug, description] of categorias) {
    cats[name] = await prisma.category.create({
      data: { name, slug, description },
    });
  }

  console.log("Seed: tags...");
  const tagNames = [
    "espírito santo",
    "vitória",
    "vila velha",
    "cachoeiro de itapemirim",
    "serra",
    "colatina",
    "café conilon",
    "rochas ornamentais",
    "exportação",
    "porto de vitória",
    "governo do es",
    "emprego",
    "inovação",
    "futebol capixaba",
  ];
  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    const slug = name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    tags[name] = await prisma.tag.create({ data: { name, slug } });
  }

  console.log("Seed: notícias de junho/2026...");
  type SeedPost = {
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    author: { id: string };
    tags: string[];
    status?: PostStatus;
    featured?: boolean;
    day: number;
    viewCount?: number;
    cover: string;
    sourceType?: SourceType;
    generatedByAi?: boolean;
  };

  const posts: SeedPost[] = [
    {
      title: "Safra do café conilon 2026 deve bater recorde no Espírito Santo",
      slug: "safra-cafe-conilon-2026-recorde-espirito-santo",
      summary:
        "Colheita avança no norte do estado com projeção de 12% de crescimento; clima favorável e renovação de lavouras puxam resultado.",
      content: `A colheita do café conilon avança pelo norte do Espírito Santo com projeção de safra recorde em 2026. Segundo levantamento divulgado em junho, a produção deve crescer cerca de 12% em relação ao ciclo anterior.

## Clima ajudou

O regime de chuvas entre outubro e março favoreceu a granação dos frutos nas principais regiões produtoras — Jaguaré, Sooretama, Vila Valério e São Mateus. Produtores relatam peneira alta e boa qualidade de bebida.

## Renovação de lavouras

Programas de renovação com clones mais produtivos e tolerantes à seca, conduzidos nos últimos cinco anos, começam a mostrar resultado em escala. A produtividade média do estado segue como referência mundial para o conilon.

## Preço e mercado

Com demanda aquecida da indústria de solúveis e blends, o produtor capixaba encontra mercado firme. Cooperativas da região norte já negociam lotes futuros com prêmio sobre a cotação de referência.

O Espírito Santo responde por cerca de 70% do conilon brasileiro — e a safra 2026 deve reforçar essa liderança.`,
      category: "Agro",
      author: autorRicardo,
      tags: ["café conilon", "espírito santo", "exportação"],
      featured: true,
      day: 28,
      viewCount: 1874,
      cover: "/uploads/news-agro.jpg",
    },
    {
      title: "Exportação de mármore e granito do ES cresce 9% no primeiro semestre",
      slug: "exportacao-marmore-granito-es-cresce-primeiro-semestre",
      summary:
        "Cachoeiro de Itapemirim e região puxam embarques; Estados Unidos seguem como principal destino das rochas capixabas.",
      content: `As exportações de rochas ornamentais do Espírito Santo fecharam o primeiro semestre de 2026 com alta de 9% em faturamento, segundo dados do setor divulgados em junho.

## Cachoeiro no centro do mapa

O polo de Cachoeiro de Itapemirim, maior centro de beneficiamento de mármore e granito do país, opera com carteira cheia. Teares multifio e linhas de resinagem trabalham em capacidade máxima para atender pedidos externos.

## Destinos

Os Estados Unidos permanecem como principal comprador, seguidos por México e Europa. Materiais exóticos e quartzitos capixabas ganham espaço em projetos de alto padrão no exterior.

## Logística

O escoamento pelo complexo portuário capixaba — Vitória e Barra do Riacho — mantém competitividade do produto local. O setor pede, porém, avanço nas obras de acesso rodoviário ao sul do estado.

As rochas seguem entre os três principais produtos da pauta de exportação do Espírito Santo.`,
      category: "Pedras",
      author: autorFabio,
      tags: ["rochas ornamentais", "cachoeiro de itapemirim", "exportação", "porto de vitória"],
      featured: true,
      day: 25,
      viewCount: 1432,
      cover: "/uploads/news-pedras.jpg",
    },
    {
      title: "Grande Loja do ES celebra 150 anos da maçonaria capixaba com sessão magna em Vitória",
      slug: "maconaria-capixaba-150-anos-sessao-magna-vitoria",
      summary:
        "Evento em junho reuniu lojas de todo o estado; programação incluiu ações sociais e doação de sangue em parceria com o Hemoes.",
      content: `A maçonaria capixaba celebrou em junho de 2026 os 150 anos de fundação das primeiras lojas no Espírito Santo, com sessão magna realizada em Vitória e programação aberta de ações sociais.

## Sessão magna

O encontro reuniu representantes de lojas de todas as regiões do estado, além de delegações de potências co-irmãs de Minas Gerais, Rio de Janeiro e Bahia. A cerimônia destacou a trajetória da ordem no desenvolvimento capixaba.

## Ações sociais

A programação do sesquicentenário incluiu campanha de doação de sangue em parceria com o Hemoes, arrecadação de alimentos para instituições de acolhimento e mutirão de reforma em uma escola pública da Grande Vitória.

## Memória

Documentos e objetos históricos das lojas centenárias do estado ficaram em exposição aberta ao público, com visitação gratuita durante todo o mês.

A celebração reforça o papel das instituições fraternais na história social do Espírito Santo.`,
      category: "Maçonaria",
      author: autorMariana,
      tags: ["vitória", "espírito santo"],
      day: 21,
      viewCount: 689,
      cover: "/uploads/news-maconaria.jpg",
    },
    {
      title: "ES registra saldo positivo de 8,4 mil vagas com carteira assinada em junho",
      slug: "es-saldo-positivo-vagas-carteira-assinada-junho",
      summary:
        "Serviços e construção civil lideram contratações; indústria de rochas e metalmecânica também ampliam quadros.",
      content: `O mercado de trabalho capixaba fechou junho de 2026 com saldo positivo de aproximadamente 8,4 mil vagas com carteira assinada, o melhor resultado do ano.

## Setores que puxaram

O setor de serviços liderou as contratações, seguido pela construção civil — aquecida por obras públicas e privadas na Grande Vitória. Indústrias de rochas no sul e metalmecânica na Serra também ampliaram quadros.

## Perfil das vagas

Operadores de produção, técnicos de manutenção, profissionais de logística e atendimento concentram as oportunidades. Empresas relatam dificuldade para preencher vagas técnicas — um alerta para a formação profissional.

## Salários

O salário médio de admissão no estado avançou, refletindo a disputa por mão de obra qualificada em setores exportadores.

Especialistas em RH recomendam que empresas invistam em trilhas internas de qualificação para reter talentos num mercado aquecido.`,
      category: "RH",
      author: autorMariana,
      tags: ["emprego", "espírito santo", "serra"],
      day: 30,
      viewCount: 954,
      cover: "/uploads/news-rh.jpg",
    },
    {
      title: "Polo metalmecânico da Serra anuncia investimentos de R$ 480 milhões",
      slug: "polo-metalmecanico-serra-investimentos-480-milhoes",
      summary:
        "Ampliações no Civit e TIMS incluem nova planta de estruturas metálicas e centro de usinagem de grande porte.",
      content: `Empresas do polo metalmecânico da Serra anunciaram em junho um pacote de investimentos de R$ 480 milhões em ampliação de capacidade produtiva, com foco em atender demandas de energia, mineração e infraestrutura portuária.

## O que vem por aí

Os aportes incluem uma nova planta de estruturas metálicas pesadas, um centro de usinagem de grande porte e a modernização de linhas de caldeiraria nos distritos industriais do Civit e do TIMS.

## Empregos

A previsão é de 1,2 mil empregos diretos durante a fase de obras e 600 postos permanentes após a entrada em operação, prevista para o fim de 2027.

## Encadeamento

Fornecedores locais de tratamento de superfície, transporte especializado e montagem industrial devem capturar parte relevante dos contratos — efeito direto da política de conteúdo local defendida pelas entidades do setor.

O metalmecânico capixaba consolida-se como elo estratégico entre a siderurgia local e os grandes projetos de energia do Sudeste.`,
      category: "Metal",
      author: autorFabio,
      tags: ["serra", "espírito santo", "emprego"],
      day: 18,
      viewCount: 761,
      cover: "/uploads/news-metal.jpg",
    },
    {
      title: "Assembleia aprova pacote de incentivo à interiorização econômica do ES",
      slug: "assembleia-aprova-pacote-interiorizacao-economica-es",
      summary:
        "Projeto votado em junho amplia benefícios fiscais para indústrias que se instalarem fora da Grande Vitória.",
      content: `A Assembleia Legislativa do Espírito Santo aprovou em junho de 2026 o pacote de incentivo à interiorização econômica, que amplia benefícios fiscais para empreendimentos industriais instalados fora da Região Metropolitana da Grande Vitória.

## O que muda

O texto aprovado prevê alíquotas reduzidas e prazos ampliados de fruição para indústrias que gerarem empregos em municípios do interior, com contrapartidas de contratação local e investimento em qualificação.

## Debate em plenário

A votação foi acompanhada por prefeitos de municípios do noroeste e do Caparaó, regiões que historicamente reivindicam mais presença industrial. A oposição questionou o custo fiscal; a base argumentou com o potencial de arrecadação futura.

## Próximos passos

O texto segue para sanção do governador. A regulamentação deve detalhar os critérios de enquadramento por porte e setor.

Entidades empresariais do interior comemoraram e já articulam a atração dos primeiros projetos sob as novas regras.`,
      category: "Política",
      author: autorMariana,
      tags: ["governo do es", "espírito santo", "colatina"],
      featured: true,
      day: 26,
      viewCount: 1203,
      cover: "/uploads/news-politica.jpg",
    },
    {
      title: "Capixabão 2026: final histórica leva mais de 20 mil torcedores ao Kleber Andrade",
      slug: "capixabao-2026-final-historica-kleber-andrade",
      summary:
        "Decisão de junho teve recorde de público da década e transmissão para todo o estado; campeão garante vaga na Copa do Brasil 2027.",
      content: `A final do Campeonato Capixaba de 2026, disputada em junho no estádio Kleber Andrade, em Cariacica, entrou para a história: mais de 20 mil torcedores acompanharam a decisão, maior público da década no futebol estadual.

## A decisão

Em jogo equilibrado e decidido nos detalhes, o título ficou no caldeirão da torcida que fez a festa nas arquibancadas. O campeão garantiu vaga na Copa do Brasil de 2027 e no Brasileirão da Série D.

## Renovação

A campanha vitoriosa teve base formada por atletas revelados nas categorias de base capixabas — reflexo do investimento dos clubes locais em formação nos últimos anos.

## Estrutura

O Kleber Andrade recebeu elogios pela organização, com entrada facilitada por reconhecimento facial e recorde de renda no estadual.

A federação já estuda calendário ampliado para 2027, com mais datas para os clubes do interior.`,
      category: "Esporte",
      author: autorRicardo,
      tags: ["futebol capixaba", "espírito santo", "vila velha"],
      day: 15,
      viewCount: 2210,
      cover: "/uploads/news-esporte.jpg",
    },
    {
      title: "ES amplia mutirão de cirurgias eletivas e zera fila em três especialidades",
      slug: "es-mutirao-cirurgias-eletivas-zera-fila-tres-especialidades",
      summary:
        "Balanço de junho aponta 14 mil procedimentos no semestre; catarata, hérnia e vesícula lideram atendimentos.",
      content: `O programa estadual de redução de filas cirúrgicas do Espírito Santo fechou junho de 2026 com 14 mil procedimentos realizados no semestre e fila zerada em três especialidades: catarata, hérnia e vesícula.

## Como funciona

O mutirão combina capacidade ociosa de hospitais filantrópicos, centros cirúrgicos estaduais em horário estendido e regulação unificada. Pacientes são convocados por telefone e aplicativo, com confirmação digital.

## Interior atendido

Unidades de Colatina, Cachoeiro de Itapemirim, Linhares e São Mateus concentraram os atendimentos fora da Grande Vitória, reduzindo deslocamentos de pacientes do interior.

## Próxima fase

A partir de julho, o programa incorpora cirurgias ortopédicas de média complexidade, com meta de 4 mil procedimentos até dezembro.

Conselhos municipais de saúde acompanham a execução e divulgam os números mensalmente, dando transparência à fila única estadual.`,
      category: "Saúde",
      author: autorMariana,
      tags: ["espírito santo", "governo do es", "colatina"],
      day: 24,
      viewCount: 1105,
      cover: "/uploads/news-saude.jpg",
    },
    {
      title: "Concursos no ES somam 3,7 mil vagas abertas em junho; salários chegam a R$ 21 mil",
      slug: "concursos-es-vagas-abertas-junho-2026",
      summary:
        "Editais estaduais e municipais contemplam educação, saúde, segurança e áreas administrativas; veja os principais prazos.",
      content: `Junho de 2026 fechou com cerca de 3,7 mil vagas abertas em concursos públicos no Espírito Santo, entre editais estaduais, municipais e de autarquias — com salários que chegam a R$ 21 mil em carreiras de nível superior.

## Destaques do mês

- **Educação estadual**: vagas para professores de disciplinas específicas em todas as superintendências regionais.
- **Saúde municipal**: prefeituras da Grande Vitória e do interior selecionam médicos, enfermeiros e técnicos.
- **Segurança**: certame para reforço dos quadros da segurança pública estadual em andamento.
- **Administrativo**: câmaras e prefeituras do interior com editais para níveis médio e superior.

## Fique atento aos prazos

Boa parte das inscrições encerra na primeira quinzena de julho. As bancas divulgaram cronogramas com provas previstas entre agosto e outubro.

## Dica de preparação

Especialistas recomendam foco na legislação local — Lei Orgânica municipal e estatutos — que costuma ter peso alto nas provas objetivas do ES.`,
      category: "Concursos",
      author: autorRicardo,
      tags: ["espírito santo", "emprego", "governo do es"],
      day: 29,
      viewCount: 1980,
      cover: "/uploads/news-concursos.jpg",
    },
    {
      title: "Startups capixabas captam R$ 95 milhões e ES sobe no ranking nacional de inovação",
      slug: "startups-capixabas-captam-95-milhoes-ranking-inovacao",
      summary:
        "Rodadas anunciadas em junho envolvem agtechs, logtechs e soluções para o setor de rochas; ecossistema de Vitória acelera.",
      content: `O ecossistema de inovação do Espírito Santo fechou junho de 2026 com R$ 95 milhões em rodadas de investimento anunciadas por startups locais — e o estado subiu posições no ranking nacional de ambientes de inovação.

## Onde o dinheiro foi

As captações se concentraram em três frentes com DNA capixaba:

1. **Agtechs** — monitoramento de lavouras de café e fruticultura por satélite e IA;
2. **Logtechs** — otimização de fretes e janelas portuárias no corredor logístico capixaba;
3. **Rochas 4.0** — visão computacional para classificação de chapas e gestão de pátio em beneficiadoras.

## Ecossistema

Hubs de inovação em Vitória e na Serra ampliaram programas de aceleração, e universidades locais registraram alta em depósitos de patentes. O interior também aparece: Colatina e Cachoeiro ganharam espaços maker e pré-aceleradoras.

## O que falta

Fundadores apontam a necessidade de mais capital local em estágio pré-seed e de incentivo à retenção de talentos técnicos no estado.

Com vocação em agro, logística e rochas, o ES desenha uma tese de inovação própria — conectada à economia real capixaba.`,
      category: "Tecnologia",
      author: autorFabio,
      tags: ["inovação", "vitória", "espírito santo"],
      day: 27,
      viewCount: 1540,
      cover: "/uploads/news-tecnologia.jpg",
      sourceType: "AI_ASSISTED",
      generatedByAi: true,
    },
  ];

  const createdPosts: Record<string, { id: string; title: string }> = {};
  for (const p of posts) {
    const status: PostStatus = p.status ?? "PUBLISHED";
    const post = await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        content: p.content,
        coverImageUrl: p.cover,
        authorId: p.author.id,
        categoryId: cats[p.category].id,
        status,
        sourceType: p.sourceType ?? "HUMAN",
        generatedByAi: p.generatedByAi ?? false,
        approvedById: status === "PUBLISHED" ? editor.id : null,
        publishedAt: status === "PUBLISHED" ? june(p.day) : null,
        metaTitle: p.title,
        metaDescription: p.summary,
        readingTime: readingTime(p.content),
        viewCount: p.viewCount ?? 0,
        featured: p.featured ?? false,
        createdAt: june(p.day, 8),
        tags: {
          create: p.tags.map((t) => ({ tagId: tags[t].id })),
        },
      },
    });
    createdPosts[p.slug] = post;
  }

  console.log("Seed: comentários...");
  const alvo1 = createdPosts["safra-cafe-conilon-2026-recorde-espirito-santo"];
  const alvo2 = createdPosts["capixabao-2026-final-historica-kleber-andrade"];
  const alvo3 = createdPosts["concursos-es-vagas-abertas-junho-2026"];

  await prisma.comment.createMany({
    data: [
      {
        postId: alvo1.id,
        userName: "José Carlos Pereira",
        userEmail: "jc.pereira@example.com",
        content:
          "Produzo conilon em Jaguaré há 30 anos. Essa renovação de lavoura mudou tudo por aqui, safra realmente excepcional.",
        status: "APPROVED",
        approvedAt: june(28, 15),
        moderatedById: moderador.id,
        createdAt: june(28, 14),
      },
      {
        postId: alvo2.id,
        userName: "Luciana Barcelos",
        userEmail: "lu.barcelos@example.com",
        content: "Estive no Kleber Andrade, que festa linda! O futebol capixaba merece esse público sempre.",
        status: "APPROVED",
        approvedAt: june(16, 10),
        moderatedById: moderador.id,
        createdAt: june(15, 23),
      },
      {
        postId: alvo3.id,
        userName: "Anderson Souza",
        userEmail: "and.souza@example.com",
        content: "Alguém sabe se o edital da educação aceita inscrição com diploma em fase de colação?",
        status: "PENDING",
        createdAt: june(30, 11),
      },
      {
        postId: alvo1.id,
        userName: "Visitante",
        userEmail: "spam@example.com",
        content: "GANHE DINHEIRO FÁCIL acesse www.link-suspeito.example",
        status: "REJECTED",
        rejectedReason: "Spam com link suspeito",
        moderatedById: moderador.id,
        createdAt: june(29, 3),
      },
    ],
  });

  console.log("Seed: rascunho de IA de exemplo...");
  await prisma.aiDraft.create({
    data: {
      prompt: "Startups capixabas captação investimento junho 2026",
      generatedTitle: "Startups capixabas captam R$ 95 milhões e ES sobe no ranking nacional de inovação",
      generatedSummary:
        "Rodadas anunciadas em junho envolvem agtechs, logtechs e soluções para o setor de rochas.",
      generatedContent: "Conteúdo gerado pela IA (ver notícia publicada vinculada).",
      generatedTags: "inovação, vitória, espírito santo",
      generatedMetaDescription:
        "Startups do ES captam R$ 95 mi em junho de 2026; agtechs, logtechs e rochas 4.0 lideram.",
      status: "USED",
      reviewedById: editor.id,
    },
  });

  console.log("Seed concluído — Portal 4Nexus ES, junho/2026.");
  console.log("Logins:");
  console.log("  admin@4nexus.com.br     / Admin@4nexus2026     (ADMIN)");
  console.log("  editor@4nexus.com.br    / Editor@4nexus2026    (EDITOR)");
  console.log("  redator@4nexus.com.br   / Redator@4nexus2026   (REDATOR)");
  console.log("  moderador@4nexus.com.br / Moderador@4nexus2026 (MODERADOR)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
