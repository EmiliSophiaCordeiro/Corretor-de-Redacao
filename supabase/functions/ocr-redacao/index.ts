import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DebugEvent = {
  stage: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
};

const OCR_MODEL = "google/gemini-2.5-pro";
const LOW_CONFIDENCE_THRESHOLD = 70;

const SYSTEM_PROMPT = `Você é um mecanismo de TRANSCRIÇÃO LITERAL de redações manuscritas em português brasileiro. Você NÃO é corretor, revisor, editor nem intérprete.

MISSÃO ÚNICA
Reproduzir EXATAMENTE o que está escrito à mão na folha. A fidelidade ao traço do aluno é mais importante do que a coerência da frase, do que a ortografia e do que qualquer suposição de contexto.

PROIBIÇÕES ABSOLUTAS (violá-las é falha crítica)
1. NUNCA invente palavras.
2. NUNCA substitua uma palavra pouco legível por outra "mais provável", foneticamente parecida ou semanticamente próxima.
3. NUNCA complete palavras parcialmente legíveis a partir do contexto.
4. NUNCA corrija ortografia, acentuação, pontuação, concordância, coesão, regência ou gramática.
5. NUNCA reescreva, resuma, parafraseie ou reordene o texto.
6. NUNCA adicione conteúdo que não está fisicamente escrito.
7. NUNCA transcreva cabeçalho, tema impresso, instruções, rodapé, marcações da folha, números de linha laterais ou logotipos.
8. Se você não tem certeza da leitura de uma palavra, é PROIBIDO chutar. Marque como dúvida.

COMO LIDAR COM DÚVIDA (obrigatório)
- Palavra totalmente ilegível: escreva [ilegível].
- Palavra parcialmente legível: escreva apenas as letras que você realmente enxerga, seguidas de "?" entre colchetes. Ex.: "gover[?no?]", "[?con?]seguir".
- Linha inteira ilegível: escreva apenas [ilegível] naquela linha, sem inventar frase.
- Confiança baixa é sempre preferível a texto inventado. Reduza o campo "confidence" sempre que houver dúvida.

ESTRUTURA DO TEXTO (regra crítica para a contagem de linhas)
- Reproduza o texto agrupado por PARÁGRAFOS, não por linhas físicas. Uma palavra que continua na linha seguinte da folha faz parte do mesmo parágrafo — não crie quebra ali.
- Insira uma quebra de parágrafo APENAS quando existir, na folha, um sinal claro de novo parágrafo: recuo (indentação no início da linha) ou linha em branco entre blocos de texto.
- Não quebre uma frase em duas linhas de saída por causa da largura da folha.
- Não insira linhas em branco extras entre parágrafos (uma única quebra basta).
- Não coloque espaços no início ou no final das linhas.
- Não use tabulações, hífens de fim de linha (una a palavra: "escre-" + "vendo" => "escrevendo") nem caracteres invisíveis.

SAÍDA JSON ESTRITA
Responda somente com JSON válido, sem markdown, sem comentários:
{
  "paragraphs": ["parágrafo 1 completo", "parágrafo 2 completo"],
  "physical_line_count": 0,
  "confidence": 0,
  "low_confidence_words": ["[ilegível]", "[?trecho?]"],
  "notes": "observações objetivas sobre imagem/layout"
}

- "paragraphs": lista com os parágrafos na ordem em que aparecem, cada item já com o texto completo do parágrafo (sem \\n internos).
- "physical_line_count": número aproximado de linhas físicas manuscritas que você conseguiu contar na folha (apenas informativo, não influencia a saída).
- "confidence": inteiro 0–100 refletindo sua certeza global de leitura literal.`;


const makeEvent = (
  stage: DebugEvent["stage"],
  status: DebugEvent["status"],
  message: string,
  details?: Record<string, unknown>,
): DebugEvent => ({ stage, status, message, details, timestamp: new Date().toISOString() });

const safeDataUrlBytes = (value: unknown) => {
  if (typeof value !== "string") return 0;
  const base64 = value.includes(",") ? value.split(",").pop() ?? "" : value;
  return Math.round((base64.length * 3) / 4);
};

const parseJsonObject = (content: string) => {
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Resposta do OCR não veio em JSON válido.");
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const runId = crypto.randomUUID();
  const debugEvents: DebugEvent[] = [];

  try {
    const startedAt = performance.now();
    const body = await req.json();
    const { image, processedImage, expectedLineCount, lineBands } = body;

    debugEvents.push(
      makeEvent("request_received", "ok", "Imagem recebida para OCR.", {
        run_id: runId,
        original_bytes_estimate: safeDataUrlBytes(image),
        processed_bytes_estimate: safeDataUrlBytes(processedImage),
        expected_line_count: typeof expectedLineCount === "number" ? expectedLineCount : null,
        detected_line_bands: Array.isArray(lineBands) ? lineBands.length : 0,
      }),
    );

    if (!image || typeof image !== "string") {
      debugEvents.push(makeEvent("input_validation", "error", "Imagem original ausente ou inválida."));
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const auditoriaVisual =
      typeof expectedLineCount === "number" && expectedLineCount > 0
        ? `\nObservação (apenas para você entender o layout, NÃO afeta a saída): o app detectou ~${expectedLineCount} linhas manuscritas na folha. Isso serve só para você calibrar sua leitura; NÃO tente casar esse número na saída, NÃO invente conteúdo para bater com ele e NÃO quebre parágrafos por causa dele.`
        : "";

    debugEvents.push(
      makeEvent("ai_request_prepared", "ok", "Requisição OCR preparada com imagem original e versão pré-processada.", {
        model: OCR_MODEL,
        has_processed_image: typeof processedImage === "string" && processedImage.length > 0,
      }),
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        temperature: 0,
        top_p: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcreva LITERALMENTE a redação manuscrita desta imagem. Regras críticas:\n- Nunca invente uma palavra. Se não tem certeza, marque [ilegível] ou [?letras?].\n- Nunca corrija ortografia ou gramática.\n- Agrupe por parágrafos (não por linhas físicas). Só quebre parágrafo quando houver recuo ou linha em branco na folha.\n- Junte palavras hifenizadas no fim da linha.${auditoriaVisual}`,
              },
              { type: "image_url", image_url: { url: image } },
              ...(typeof processedImage === "string" && processedImage.length > 0
                ? [
                    {
                      type: "text",
                      text: "Versão auxiliar com contraste aumentado. Use apenas se ajudar a enxergar o traço; a imagem original acima é a fonte da verdade. NÃO transcreva marcas ou artefatos criados pelo pré-processamento.",
                    },
                    { type: "image_url", image_url: { url: processedImage } },
                  ]
                : []),
            ],
          },
        ],
      }),
    });


    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      debugEvents.push(makeEvent("ai_gateway", "error", "Falha na chamada do OCR.", { status: response.status, body: text.slice(0, 1000) }));
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

    debugEvents.push(makeEvent("ai_gateway", "ok", "Resposta bruta do OCR recebida.", { raw_chars: content.length }));

    let parsed: {
      lines?: string[];
      line_count?: number;
      confidence?: number;
      low_confidence_words?: string[];
      notes?: string;
    } = {};

    try {
      parsed = parseJsonObject(content);
      debugEvents.push(makeEvent("json_parse", "ok", "JSON do OCR interpretado sem fallback."));
    } catch (parseError) {
      debugEvents.push(makeEvent("json_parse", "error", "OCR retornou formato inválido; nenhum texto foi inferido por fallback.", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      }));
      return new Response(
        JSON.stringify({
          error: "O OCR retornou uma resposta inválida. Tire uma nova foto mais nítida.",
          raw_ocr_text: content,
          debug: { run_id: runId, events: debugEvents },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lines = Array.isArray(parsed.lines) ? parsed.lines.filter((l) => typeof l === "string") : [];
    const text = lines.join("\n");
    const reportedConfidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, parsed.confidence)) : 0;
    const expectedCount = typeof expectedLineCount === "number" && expectedLineCount > 0 ? expectedLineCount : null;
    const lineDelta = expectedCount === null ? null : Math.abs(lines.length - expectedCount);
    const adjustedConfidence = lineDelta !== null && lineDelta >= 3 ? Math.min(reportedConfidence, 60) : reportedConfidence;
    const lowConfidence = adjustedConfidence < LOW_CONFIDENCE_THRESHOLD;

    debugEvents.push(
      makeEvent(lowConfidence ? "validation" : "validation", lowConfidence ? "warning" : "ok", lowConfidence ? "Confiança baixa; usuário deve refazer ou revisar a foto." : "Texto validado para preenchimento literal.", {
        parsed_lines: lines.length,
        model_reported_line_count: parsed.line_count ?? null,
        expected_line_count: expectedCount,
        line_delta: lineDelta,
        confidence_reported: reportedConfidence,
        confidence_final: adjustedConfidence,
        has_uncertain_markers: /\[(?:ilegível|\?)/i.test(text),
      }),
    );

    console.log("ocr-redacao debug", JSON.stringify({ run_id: runId, events: debugEvents }));

    return new Response(
      JSON.stringify({
        text,
        lines,
        line_count: lines.length,
        confidence: adjustedConfidence,
        low_confidence_words: Array.isArray(parsed.low_confidence_words) ? parsed.low_confidence_words : [],
        notes: typeof parsed.notes === "string" ? parsed.notes : "",
        low_confidence: lowConfidence,
        raw_ocr_text: content,
        final_text_sent_to_editor: text,
        debug: {
          run_id: runId,
          model: OCR_MODEL,
          duration_ms: Math.round(performance.now() - startedAt),
          expected_line_count: expectedCount,
          line_bands: Array.isArray(lineBands) ? lineBands : [],
          events: debugEvents,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-redacao error:", e);
    debugEvents.push(makeEvent("unhandled_error", "error", e instanceof Error ? e.message : "Erro desconhecido"));
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido", debug: { run_id: runId, events: debugEvents } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
