import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Você é um motor de transcrição OCR de alta precisão para redações manuscritas. Siga estas regras rigorosamente:

1. TRANSCRIÇÃO LITERAL ESTRITA: Transcreva o texto EXATAMENTE como escrito. NÃO corrija ortografia, gramática, pontuação ou acentuação. Se uma palavra está escrita errada (ex: 'caza' em vez de 'casa'), mantenha o erro. Sua saída deve ser um espelho fiel da escrita real do aluno.

2. EXCLUIR ELEMENTOS NÃO-CONTEÚDO: Identifique e ignore todas as informações de cabeçalho (nome, data, nome da escola, instruções, título do tema). NÃO transcreva essas partes.

3. IGNORAR NÚMEROS DE LINHA: Detecte os números de linha verticais (1, 2, 3...) na lateral da folha de redação e exclua-os do texto final.

4. ÁREA DE FOCO: Transcreva APENAS o corpo da redação contido nas linhas principais de escrita.

5. SAÍDA DETERMINÍSTICA: Forneça apenas o texto limpo, sem observações introdutórias, metadados ou frases como 'aqui está a transcrição'.

6. Palavras riscadas devem ser ignoradas.
7. Palavras ilegíveis devem ser marcadas como [ilegível].
8. Preserve quebras de linha e parágrafos conforme escritos.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva o corpo da redação manuscrita desta imagem:"
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao processar a imagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    return new Response(JSON.stringify({ text: content.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-redacao error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
