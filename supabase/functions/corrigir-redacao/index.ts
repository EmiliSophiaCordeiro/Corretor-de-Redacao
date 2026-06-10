import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

Você DEVE responder APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois. Use exatamente esta estrutura:

{
  "total_score": <número 0-1000, múltiplo de 20>,
  "competencies": {
    "c1": {"score": <0-200, múltiplo de 40>, "justification": "<análise técnica fria>"},
    "c2": {"score": <0-200, múltiplo de 40>, "justification": "<análise técnica fria>"},
    "c3": {"score": <0-200, múltiplo de 40>, "justification": "<análise técnica fria>"},
    "c4": {"score": <0-200, múltiplo de 40>, "justification": "<análise técnica fria>"},
    "c5": {"score": <0-200, múltiplo de 40>, "justification": "<análise técnica fria>"}
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
  "c5_checklist": {
    "agent": true/false,
    "action": true/false,
    "means_mode": true/false,
    "effect": true/false,
    "detail": true/false
  },
  "overall_verdict": "<síntese equilibrada: comece pelos pontos fortes da redação, depois aponte o que limitou a nota e o que o aluno pode melhorar para subir de faixa>"
}

O total_score DEVE ser a soma exata dos 5 scores de competências. Cada score de competência deve ser múltiplo de 40 (0, 40, 80, 120, 160, 200). Liste apenas os erros que realmente impactam a nota — não invente problemas para preencher a lista. Seja justo e proporcional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TEMA DA REDAÇÃO: "${theme}"\nMODO DE CORREÇÃO: ${mode_name || "ENEM Padrão"}\n\nCorrija a seguinte redação com rigor máximo. Verifique se o texto aborda o tema proposto — se houver fuga total do tema, a nota deve ser ZERO em todas as competências. Se houver tangenciamento (abordagem parcial), penalize severamente na C2.\n\n${essay}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao processar a correção." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("corrigir-redacao ai response", JSON.stringify({ content_chars: content.length, preview: content.slice(0, 240) }));

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

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
