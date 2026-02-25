import { GradingResult } from "@/lib/types";

export const mockResult: GradingResult = {
  total_score: 640,
  competencies: {
    c1: {
      score: 120,
      justification:
        "Texto apresenta desvios recorrentes de concordância verbal e nominal (parágrafos 2 e 3). Uso inadequado de vírgulas antes de orações restritivas. Ausência de estruturas sintáticas complexas — predominam períodos simples coordenados. Mais de 4 desvios graves identificados, incompatível com nível 4.",
    },
    c2: {
      score: 160,
      justification:
        "O tema é abordado, mas o repertório sociocultural (citação a Bauman) é utilizado de forma decorativa. O candidato menciona 'modernidade líquida' sem estabelecer vínculo explícito e produtivo com a tese defendida. Repertório pertinente, porém não produtivo — capped at 160.",
    },
    c3: {
      score: 120,
      justification:
        "Projeto de texto identificável, mas com hierarquização fraca. O segundo parágrafo argumentativo repete a ideia central do primeiro com palavras diferentes (raciocínio circular). Ausência de progressão temática clara. Estrutura de template genérico detectada.",
    },
    c4: {
      score: 120,
      justification:
        "Conectivos interparágrafos limitados a 'Além disso' e 'Portanto'. Repetição do termo 'sociedade' 7 vezes ao longo do texto sem substituição lexical. Articulação intraparágrafo insuficiente — frases justapostas sem elementos coesivos no D2.",
    },
    c5: {
      score: 120,
      justification:
        "Proposta de intervenção apresenta agente (governo) e ação (criar campanhas), mas omite o meio/modo específico e o detalhamento. Efeito mencionado de forma vaga ('melhorar a situação'). Apenas 3 dos 5 elementos obrigatórios presentes.",
    },
  },
  specific_errors: [
    {
      type: "Gramatical",
      location: "Parágrafo 1",
      technical_description:
        "Ausência de vírgula após adjunto adverbial deslocado: 'No Brasil atualmente os jovens...' — deveria ser 'No Brasil, atualmente, os jovens...'",
      inep_rule:
        "Competência 1 — Desvio de pontuação que compromete a clareza do período.",
      level_impact:
        "Desvios recorrentes de pontuação impedem classificação acima do nível 3 (120/200).",
    },
    {
      type: "Gramatical",
      location: "Parágrafo 2",
      technical_description:
        "Erro de concordância verbal: 'Os problemas que existe' — o verbo deveria concordar com o sujeito plural: 'Os problemas que existem'.",
      inep_rule:
        "Competência 1 — Desvio de concordância verbal, erro grave de norma culta.",
      level_impact:
        "Concordância é critério de alta penalização. Um único erro grave pode rebaixar em um nível.",
    },
    {
      type: "Argumentativo",
      location: "Parágrafo 2",
      technical_description:
        "Citação de Zygmunt Bauman ('modernidade líquida') sem articulação com o argumento. A referência aparece isolada, como ornamento, sem explicação de como se aplica ao tema.",
      inep_rule:
        "Competência 2 — Repertório pertinente mas não produtivo. Uso decorativo de referência sociocultural.",
      level_impact:
        "Repertório não produtivo impede classificação no nível 5 (200/200). Score capped at 160.",
    },
    {
      type: "Estrutural",
      location: "Parágrafos 2-3",
      technical_description:
        "D2 e D3 apresentam a mesma tese reformulada. Parágrafo 3 não introduz argumento novo — apenas parafraseia o anterior com exemplos similares. Raciocínio circular.",
      inep_rule:
        "Competência 3 — Ausência de progressão argumentativa. Projeto de texto sem hierarquização.",
      level_impact:
        "Raciocínio circular é indicador de nível 3 (120/200) na C3.",
    },
    {
      type: "Estrutural",
      location: "Parágrafo 4",
      technical_description:
        "Início do parágrafo com 'Portanto' sem retomar os argumentos desenvolvidos. Conclusão genérica que poderia ser aplicada a qualquer tema.",
      inep_rule:
        "Competência 4 — Articulação deficiente entre conclusão e desenvolvimento.",
      level_impact:
        "Conectivo inadequado na transição final reduz a avaliação de coesão.",
    },
    {
      type: "Argumentativo",
      location: "Parágrafo 4 (Proposta)",
      technical_description:
        "Proposta omite meio/modo ('como' a ação será executada) e detalhamento. 'O governo deve criar campanhas para melhorar a situação' carece de especificidade.",
      inep_rule:
        "Competência 5 — Elementos obrigatórios: agente, ação, meio/modo, efeito, detalhamento. Faltam 2.",
      level_impact:
        "Ausência de 2+ elementos impede classificação acima do nível 3 (120/200).",
    },
  ],
  c5_checklist: {
    agent: true,
    action: true,
    means_mode: false,
    effect: true,
    detail: false,
  },
  overall_verdict:
    "Redação demonstra domínio mediano da norma culta com desvios graves recorrentes. O repertório sociocultural é pertinente mas não produtivo — citação decorativa de Bauman. Projeto argumentativo fraco com raciocínio circular entre D2 e D3. Coesão limitada por conectivos repetitivos e ausência de substituição lexical. Proposta de intervenção incompleta (3/5 elementos). Nota incompatível com faixa 800+. Para avançar, o candidato precisa: (1) dominar pontuação e concordância, (2) articular repertório com a tese, (3) garantir progressão entre parágrafos, (4) completar todos os 5 elementos da proposta.",
};
