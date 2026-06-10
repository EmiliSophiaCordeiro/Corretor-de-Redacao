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

const SYSTEM_PROMPT = `Você é um mecanismo de TRANSCRIÇÃO LITERAL de redações manuscritas em português brasileiro. Você NÃO é corretor, revisor nem editor.

MISSÃO ÚNICA
Reproduzir exatamente o texto manuscrito visível na folha, mantendo uma linha de saída para cada linha física escrita. A fidelidade visual é mais importante que a coerência da frase.

PROIBIÇÕES ABSOLUTAS
1. Não invente palavras.
2. Não substitua letras por uma palavra "mais provável".
3. Não complete palavras parcialmente legíveis.
4. Não corrija ortografia, acentuação, pontuação, concordância, coesão ou gramática.
5. Não reconstrua frases pelo contexto.
6. Não divida uma linha física em duas linhas de saída.
7. Não una linhas físicas diferentes.
8. Não transcreva cabeçalho, tema impresso, instruções, marcações da folha ou números laterais.

COMO LIDAR COM DÚVIDA
- Se uma palavra estiver ilegível: escreva exatamente [ilegível].
- Se apenas algumas letras forem visíveis: escreva as letras visíveis e marque dúvida, por exemplo [?con...?].
- Se uma linha estiver muito ruim, transcreva [ilegível] naquela linha em vez de criar uma frase.
- Se houver muitas dúvidas, reduza a confiança. Confiança baixa é melhor que texto inventado.

LINHAS — REGRA MAIS IMPORTANTE
- Cada item de "lines" deve corresponder a UMA linha física da redação.
- Não quebre linha por largura da tela ou por tamanho da frase.
- Omita linhas totalmente em branco.
- Se o aplicativo informar uma contagem visual aproximada, use-a apenas como auditoria de layout. Se discordar, explique em "notes" e reduza a confiança.

SAÍDA JSON ESTRITA
Responda somente com JSON válido, sem markdown:
{
  "lines": ["linha física 1", "linha física 2"],
  "line_count": 2,
  "confidence": 0,
  "low_confidence_words": ["[ilegível]", "[?trecho?]"],
  "notes": "observações objetivas sobre imagem/layout"
}`;

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

    const detectedLinesText =
      typeof expectedLineCount === "number" && expectedLineCount > 0
        ? `\nAuditoria visual do aplicativo: foram detectadas aproximadamente ${expectedLineCount} linhas manuscritas. Bandas normalizadas: ${JSON.stringify(lineBands ?? [])}. Use isso para evitar criar quebras artificiais, mas priorize a imagem se houver divergência clara.`
        : "\nAuditoria visual do aplicativo: sem contagem confiável de linhas detectada.";

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
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcreva literalmente a redação manuscrita. Não melhore, não corrija, não complete, não adivinhe palavras. Use [ilegível] ou [?trecho?] quando houver dúvida. O texto final será enviado diretamente para correção, então cada linha deve corresponder à linha física da folha.${detectedLinesText}`,
              },
              { type: "image_url", image_url: { url: image } },
              ...(typeof processedImage === "string" && processedImage.length > 0
                ? [
                    {
                      type: "text",
                      text: "Versão pré-processada para leitura de contraste. Use apenas para enxergar melhor; não altere o conteúdo.",
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
