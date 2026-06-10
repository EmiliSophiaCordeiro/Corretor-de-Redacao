import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um motor especialista em OCR de redações MANUSCRITAS em PORTUGUÊS BRASILEIRO (ENEM/vestibular). Sua missão é reproduzir o texto EXATAMENTE como está na folha, linha por linha, sem inventar nada.

REGRAS ABSOLUTAS DE FIDELIDADE
1. TRANSCRIÇÃO LITERAL: não corrija ortografia, acentuação, pontuação ou concordância. Se o aluno escreveu "caza", escreva "caza". Erros do aluno devem ser preservados.
2. NÃO ALUCINE: é PROIBIDO inventar palavras para "fazer sentido". Se uma palavra está ilegível ou de baixa confiança, marque-a como [?palavra_provavel?] ou [ilegível]. Prefira marcar incerteza a chutar.
3. CONTEXTO PORTUGUÊS: use o contexto da frase em português apenas para DESAMBIGUAR letras visualmente parecidas (a/o, n/u, e/c, m/n, rr/n), nunca para substituir palavras inteiras.
4. PALAVRAS RISCADAS: ignore completamente (não transcreva).

ESTRUTURA DE LINHAS — CRÍTICO
5. PRESERVE A ESTRUTURA VISUAL EXATA: uma linha de saída = uma linha física da folha de redação.
6. CONTE AS LINHAS PELOS NÚMEROS LATERAIS (1, 2, 3, ...) que aparecem na margem. O número de linhas transcritas DEVE ser igual ao número de linhas COM ESCRITA na folha.
7. NÃO crie linhas extras por quebra automática. NÃO una linhas. NÃO divida uma linha em duas.
8. Linhas em branco (sem escrita do aluno) devem ser omitidas — só transcreva linhas com conteúdo escrito.

EXCLUSÕES
9. Ignore cabeçalho (nome, escola, data), título do tema impresso, instruções e os próprios números de linha da margem.
10. Transcreva APENAS o corpo manuscrito da redação.

SAÍDA — JSON ESTRITO
Responda APENAS com um objeto JSON válido (sem markdown, sem \`\`\`), no formato:
{
  "lines": ["linha 1 exata", "linha 2 exata", "..."],
  "line_count": <int igual a lines.length>,
  "confidence": <int 0-100, sua confiança média na transcrição>,
  "low_confidence_words": ["palavras ou trechos onde houve dúvida"],
  "notes": "observações curtas sobre qualidade da imagem, se relevante"
}

Se a imagem não contiver redação manuscrita legível, retorne lines: [], confidence: 0 e explique em notes.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva esta redação manuscrita seguindo TODAS as regras. Preserve a quantidade exata de linhas escritas. Marque incertezas em vez de inventar. Retorne APENAS o JSON especificado.",
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      const msg =
        status === 429
          ? "Muitas requisições. Aguarde alguns segundos."
          : status === 402
          ? "Créditos de IA insuficientes. Adicione créditos no workspace."
          : "Erro ao processar a imagem.";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    // Parse JSON (with fallback if model wrapped in code fences)
    let parsed: {
      lines?: string[];
      line_count?: number;
      confidence?: number;
      low_confidence_words?: string[];
      notes?: string;
    } = {};
    const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat as raw text, split by newlines
      const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
      parsed = { lines, line_count: lines.length, confidence: 50, low_confidence_words: [], notes: "Parsing fallback" };
    }

    const lines = Array.isArray(parsed.lines) ? parsed.lines.filter((l) => typeof l === "string") : [];
    const text = lines.join("\n");

    return new Response(
      JSON.stringify({
        text,
        lines,
        line_count: lines.length,
        confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, parsed.confidence)) : null,
        low_confidence_words: Array.isArray(parsed.low_confidence_words) ? parsed.low_confidence_words : [],
        notes: typeof parsed.notes === "string" ? parsed.notes : "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-redacao error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
