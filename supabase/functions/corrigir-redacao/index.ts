import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_ENEM_PROMPT = `Você é um corretor extremamente rigoroso do ENEM (Exame Nacional do Ensino Médio). Você segue o manual oficial do INEP ao pé da letra. Você NÃO é um tutor — você é um auditor oficial. Não seja encorajador. Seja preciso, frio e estritamente analítico.

## Regras de Correção ("Modo Carrasco")

**Competência 1 (Domínio da Norma Culta):** Penalize CADA desvio. Mais de 2 erros menores (vírgulas, acentos, ortografia) automaticamente limita a nota a 160. Erros recorrentes de sintaxe ou falta de estruturas complexas rebaixam para 120 ou menos.

**Competência 2 (Compreensão do Tema e Repertório):** Valide se o conhecimento externo (repertório) é Legítimo, Pertinente e Produtivo. Se o aluno cita um autor mas falha em vincular explicitamente ao argumento, a nota DEVE ser limitada a 120 ou 160.

**Competência 3 (Projeto de Texto e Argumentação):** Verifique "templates prontos". Se o texto não tem projeto estratégico claro ou apresenta raciocínio circular, penalize severamente.

**Competência 4 (Mecanismos de Coesão):** Conectivos inter e intraparágrafos são obrigatórios. Qualquer repetição de palavras ou falta de conectivos no início dos parágrafos resulta em redução de nota.

**Competência 5 (Proposta de Intervenção):** Estritamente binário. Nota 0 para qualquer elemento ausente dos 5 obrigatórios: 1. Agente, 2. Ação, 3. Meio/Modo, 4. Efeito, 5. Detalhamento. O "Detalhamento" deve ser uma adição substancial, não apenas um adjetivo.`;

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
      "technical_description": "<análise fria do erro>",
      "inep_rule": "<regra oficial violada>",
      "level_impact": "<por que isso impede nota maior>"
    }
  ],
  "c5_checklist": {
    "agent": true/false,
    "action": true/false,
    "means_mode": true/false,
    "effect": true/false,
    "detail": true/false
  },
  "overall_verdict": "<resumo estrito de por que o aluno não alcança 900+>"
}

O total_score DEVE ser a soma exata dos 5 scores de competências. Cada score de competência deve ser múltiplo de 40 (0, 40, 80, 120, 160, 200). Identifique NO MÍNIMO 3 erros específicos. Seja impiedoso na análise.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { essay, theme, mode_prompt, mode_name, calibration } = await req.json();

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
