import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_ENEM_PROMPT = `Você é um corretor experiente do ENEM, treinado segundo o manual oficial do INEP. Sua função é simular fielmente uma correção humana: rigorosa, criteriosa e justa, mas NÃO punitiva. Você reconhece tanto os acertos quanto os problemas do texto, aplica o princípio da proporcionalidade e considera a redação como um conjunto coerente antes de definir cada nota.

## Princípios Gerais de Correção

- Diferencie erros GRAVES (que comprometem a compreensão ou violam estruturas centrais da norma culta) de erros LEVES (desvios pontuais que não prejudicam o entendimento).
- Pequenos desvios isolados NÃO devem rebaixar drasticamente a nota.
- Avalie cada competência de forma independente: uma competência fraca não deve contaminar as demais.
- Valorize acertos: progressão argumentativa, repertório pertinente, domínio razoável da norma, coesão funcional e proposta completa devem ser reconhecidos.
- Aplique proporcionalidade: o desconto deve refletir o IMPACTO real do problema na qualidade do texto.
- Use as faixas reais do INEP: redações boas costumam ficar entre 760 e 920; excelentes alcançam 960 ou 1000 quando atendem plenamente às competências.

## Referência de Níveis por Competência (cada competência vale 0–200, em múltiplos de 40)

- **200 (Nível 5):** Excelente domínio. Pode haver desvios MUITO pontuais, desde que não comprometam o conjunto.
- **160 (Nível 4):** Bom domínio. Desvios ocasionais, mas o texto cumpre com solidez o critério.
- **120 (Nível 3):** Domínio mediano. Problemas perceptíveis, mas o texto ainda atende ao essencial.
- **80 (Nível 2):** Domínio insuficiente, com problemas frequentes.
- **40 (Nível 1):** Domínio precário.
- **0:** Não atende ao critério.

## Critérios por Competência

**Competência 1 (Domínio da Norma Culta):** Avalie a quantidade e a gravidade dos desvios em relação à extensão do texto. Poucos desvios leves (vírgulas, acentuação, ortografia esporádica) são compatíveis com 160 ou até 200. Apenas desvios graves recorrentes (concordância, regência, sintaxe quebrada) devem limitar a nota a 120 ou menos. Não exija "estruturas complexas" como obrigatórias para 200 — exija domínio consistente da norma.

**Competência 2 (Compreensão do Tema e Repertório):** O texto deve abordar o tema integralmente. Repertório sociocultural é valorizado quando legítimo e pertinente; a articulação produtiva eleva à nota máxima, mas um repertório pertinente, ainda que não brilhantemente articulado, é compatível com 160. Repertórios válidos não precisam ser sofisticados — exemplos históricos, dados, leis, obras conhecidas são plenamente aceitos. Apenas tangenciamento real ao tema deve causar penalização severa.

**Competência 3 (Projeto de Texto e Argumentação):** Avalie a progressão argumentativa de forma flexível. Um projeto de texto claro, com tese definida e argumentos que se desenvolvem, é compatível com 160 ou 200, mesmo que não seja inovador. Penalize apenas quando houver raciocínio genuinamente circular, ausência de projeto ou contradições internas relevantes.

**Competência 4 (Mecanismos de Coesão):** Repetições ocasionais de palavras ou conectivos NÃO devem rebaixar significativamente a nota. Avalie se há articulação funcional entre parágrafos e dentro deles. Variedade de conectivos e substituições lexicais elevam a nota; ausência total ou uso muito repetitivo é que deve ser penalizado.

**Competência 5 (Proposta de Intervenção):** Verifique os 5 elementos: agente, ação, meio/modo, efeito e detalhamento. A proposta deve ser concreta e relacionada ao tema. Seja criterioso, mas não excessivamente literal: o detalhamento pode aparecer junto a outro elemento, desde que adicione informação substantiva. Proposta completa e bem articulada = 200; faltando 1 elemento claramente = 160; faltando 2 = 120.

## Tom do Feedback

- Aponte pontos fortes ANTES dos pontos de melhoria em cada justificativa quando couber.
- Explique claramente o motivo de cada desconto e seu impacto aproximado.
- Use linguagem técnica, mas respeitosa — evite tom punitivo ou desencorajador.
- Reconheça o que contribuiu para elevar a nota.`;

const OUTPUT_FORMAT = `
## Formato de Saída

Você DEVE responder APENAS com um objeto JSON válido, sem markdown, sem crases, sem texto antes ou depois. Use exatamente esta estrutura:

{
  "total_score": <número 0-1000, múltiplo de 20>,
  "competencies": {
    "c1": {"score": <0-200, múltiplo de 40>, "justification": "<justificativa técnica e específica, citando o texto>"},
    "c2": {"score": <0-200, múltiplo de 40>, "justification": "<justificativa técnica e específica>"},
    "c3": {"score": <0-200, múltiplo de 40>, "justification": "<justificativa técnica e específica>"},
    "c4": {"score": <0-200, múltiplo de 40>, "justification": "<justificativa técnica e específica>"},
    "c5": {"score": <0-200, múltiplo de 40>, "justification": "<justificativa técnica e específica>"}
  },
  "specific_errors": [
    {
      "type": "Gramatical|Estrutural|Argumentativo",
      "location": "Parágrafo X",
      "technical_description": "<descrição clara do problema, indicando gravidade: leve, moderado ou grave>",
      "inep_rule": "<critério INEP relacionado>",
      "level_impact": "<impacto proporcional na competência correspondente>"
    }
  ],
  "strengths": ["<ponto positivo concreto observado no texto>", "..."],
  "suggestions": ["<sugestão prática e acionável de melhoria>", "..."],
  "c5_checklist": {
    "agent": true/false,
    "action": true/false,
    "means_mode": true/false,
    "effect": true/false,
    "detail": true/false
  },
  "overall_verdict": "<síntese equilibrada: comece pelos pontos fortes da redação, depois aponte o que limitou a nota e o que o aluno pode melhorar para subir de faixa>"
}

Regras obrigatórias:
- "strengths": no mínimo 2 e no máximo 6 itens, sempre baseados no texto real. Nunca invente.
- "suggestions": no mínimo 3 e no máximo 6 itens, práticos e ligados aos problemas apontados.
- "overall_verdict": no mínimo 3 frases.
- Nunca deixe campos vazios, nulos ou com texto genérico.
- O total_score DEVE ser a soma exata dos 5 scores de competências. Cada score de competência deve ser múltiplo de 40 (0, 40, 80, 120, 160, 200).
- Liste apenas os erros que realmente existem no texto — não invente problemas para preencher a lista.`;

type Competency = { score: number; justification: string };

const clampScore = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(200, Math.max(0, Math.round(n / 40) * 40));
};

const asText = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/```+/g, "").trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

const asStringList = (value: unknown, max: number): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.replace(/```+/g, "").trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, max);
};

/** Extracts the first balanced JSON object from an arbitrary model answer. */
const extractJsonObject = (raw: string): unknown => {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  if (start === -1) throw new Error("no json object");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("unbalanced json object");
};

/** Guarantees a complete, renderable result no matter what the model returned. */
const normalizeResult = (parsed: any) => {
  const comps: Record<string, Competency> = {};
  const labels: Record<string, string> = {
    c1: "Domínio da norma culta",
    c2: "Compreensão do tema e repertório",
    c3: "Projeto de texto e argumentação",
    c4: "Mecanismos de coesão",
    c5: "Proposta de intervenção",
  };
  for (const key of ["c1", "c2", "c3", "c4", "c5"]) {
    const src = parsed?.competencies?.[key] ?? {};
    comps[key] = {
      score: clampScore(src.score),
      justification: asText(
        src.justification,
        `Não foi possível detalhar a análise de ${labels[key]} nesta correção. Reenvie a redação para uma avaliação completa desta competência.`,
      ),
    };
  }

  const sum = Object.values(comps).reduce((acc, c) => acc + c.score, 0);

  const errors = Array.isArray(parsed?.specific_errors)
    ? parsed.specific_errors
        .filter((e: any) => e && typeof e === "object")
        .map((e: any) => ({
          type: ["Gramatical", "Estrutural", "Argumentativo"].includes(e.type) ? e.type : "Estrutural",
          location: asText(e.location, "Texto"),
          technical_description: asText(e.technical_description, "Problema identificado no texto."),
          inep_rule: asText(e.inep_rule, "Critério INEP correspondente à competência afetada."),
          level_impact: asText(e.level_impact, "Impacto proporcional na competência correspondente."),
        }))
        .slice(0, 30)
    : [];

  let strengths = asStringList(parsed?.strengths, 6);
  if (strengths.length === 0) {
    strengths = [
      sum >= 600
        ? "O texto mantém estrutura dissertativo-argumentativa reconhecível e desenvolve o tema proposto."
        : "O texto foi entregue dentro da proposta dissertativo-argumentativa e apresenta base para evolução.",
    ];
  }

  let suggestions = asStringList(parsed?.suggestions, 6);
  if (suggestions.length === 0) {
    suggestions = errors.slice(0, 3).map((e: any) => `Revise: ${e.technical_description}`);
  }
  if (suggestions.length === 0) {
    suggestions = [
      "Releia o texto verificando concordância, pontuação e regência.",
      "Reforce o repertório sociocultural com dados, leis ou obras articulados ao argumento.",
      "Garanta que a proposta de intervenção traga agente, ação, meio, efeito e detalhamento.",
    ];
  }

  const checklistSrc = parsed?.c5_checklist ?? {};
  const c5_checklist = {
    agent: checklistSrc.agent === true,
    action: checklistSrc.action === true,
    means_mode: checklistSrc.means_mode === true,
    effect: checklistSrc.effect === true,
    detail: checklistSrc.detail === true,
  };

  const overall_verdict = asText(
    parsed?.overall_verdict ?? parsed?.conclusion,
    `A redação alcançou ${sum} pontos. Considere os pontos positivos listados como base e trabalhe as sugestões apontadas para subir de faixa na próxima correção.`,
  );

  return {
    total_score: Math.min(1000, Math.max(0, sum)),
    competencies: comps,
    specific_errors: errors,
    strengths,
    suggestions,
    c5_checklist,
    overall_verdict,
  };
};


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { essay, theme, mode_prompt, mode_name, calibration } = await req.json();


    console.log("corrigir-redacao payload", JSON.stringify({
      essay_chars: typeof essay === "string" ? essay.length : 0,
      essay_lines: typeof essay === "string" ? essay.split("\n").length : 0,
      theme_chars: typeof theme === "string" ? theme.length : 0,
      mode_name: mode_name || "ENEM Padrão",
    }));

    if (!essay || typeof essay !== "string" || essay.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Redação muito curta ou inválida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!theme || typeof theme !== "string" || theme.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Tema da redação não informado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt based on mode and calibration
    let systemPrompt: string;
    
    if (mode_name === "ENEM Padrão" || !mode_prompt) {
      systemPrompt = BASE_ENEM_PROMPT;
    } else {
      systemPrompt = mode_prompt;
    }

    // Add calibration overrides if present
    if (calibration) {
      systemPrompt += "\n\n## Instruções de Calibração do Corretor\n";
      if (calibration.preferred_tone) {
        const toneMap: Record<string, string> = {
          strict: "Seja extremamente rigoroso e frio na análise.",
          balanced: "Seja equilibrado: aponte erros mas reconheça acertos.",
          encouraging: "Seja encorajador, mas honesto. Destaque pontos positivos antes dos negativos.",
          formal: "Use linguagem acadêmica formal na análise.",
        };
        systemPrompt += `\nTom: ${toneMap[calibration.preferred_tone] || calibration.preferred_tone}`;
      }
      if (calibration.custom_criteria) {
        systemPrompt += `\nCritérios específicos do corretor: ${calibration.custom_criteria}`;
      }
      if (calibration.common_feedback_patterns) {
        systemPrompt += `\nPadrões de feedback a seguir: ${calibration.common_feedback_patterns}`;
      }
      if (calibration.additional_instructions) {
        systemPrompt += `\nInstruções adicionais: ${calibration.additional_instructions}`;
      }
    }

    systemPrompt += OUTPUT_FORMAT;

    const startedAt = Date.now();
    const userMessage = `TEMA DA REDAÇÃO: "${theme}"\nMODO DE CORREÇÃO: ${mode_name || "ENEM Padrão"}\n\nCorrija a seguinte redação. Verifique se o texto aborda o tema proposto — se houver fuga total do tema, a nota deve ser ZERO em todas as competências. Se houver tangenciamento (abordagem parcial), penalize na C2. Responda somente com o objeto JSON especificado.\n\n${essay}`;

    const callModel = async (extraInstruction?: string) => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Lovable-API-Key": LOVABLE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: extraInstruction ? `${userMessage}\n\n${extraInstruction}` : userMessage,
            },
          ],
        }),
      });
      return res;
    };

    let response = await callModel();

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos para continuar corrigindo." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "A correção por IA está indisponível para esta conta no momento." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Não conseguimos concluir a correção agora. Tente novamente em instantes." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const readContent = async (res: Response): Promise<string> => {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      return typeof content === "string" ? content : "";
    };

    let content = await readContent(response);
    let parsed: unknown = null;

    const tryParse = (raw: string) => {
      if (!raw.trim()) return null;
      try {
        return extractJsonObject(raw);
      } catch (err) {
        console.error("corrigir-redacao parse failure", String(err), raw.slice(0, 400));
        return null;
      }
    };

    parsed = tryParse(content);

    // One deterministic retry when the model answers empty or unparseable.
    if (!parsed) {
      const retry = await callModel(
        "Sua resposta anterior não era um JSON válido. Responda AGORA apenas com o objeto JSON no formato exigido, sem markdown e sem qualquer texto adicional.",
      );
      if (retry.ok) {
        content = await readContent(retry);
        parsed = tryParse(content);
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return new Response(
        JSON.stringify({ error: "A análise não pôde ser concluída desta vez. Envie a redação novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      ...normalizeResult(parsed),
      analysis_ms: Date.now() - startedAt,
      analyzed_at: new Date().toISOString(),
      mode_name: typeof mode_name === "string" && mode_name.trim() ? mode_name : "ENEM Padrão",
    };

    console.log("corrigir-redacao result", JSON.stringify({
      total_score: result.total_score,
      errors: result.specific_errors.length,
      strengths: result.strengths.length,
      suggestions: result.suggestions.length,
      analysis_ms: result.analysis_ms,
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("corrigir-redacao error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
