import { useState } from "react";
import EssayEditor from "@/components/EssayEditor";
import GradingResults from "@/components/GradingResults";
import OCRSplitView from "@/components/OCRSplitView";
import CorrectionModeSelector, { CorrectionMode } from "@/components/CorrectionModeSelector";
import CalibrationPanel from "@/components/CalibrationPanel";
import { GradingResult } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import Mascot from "@/components/Mascot";
import { Sparkles } from "lucide-react";

const Studio = () => {
  const { user } = useAuth();
  const { refetch } = useUserStats();
  const [result, setResult] = useState<GradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<CorrectionMode | null>(null);
  const [essayTextFromOCR, setEssayTextFromOCR] = useState<string | null>(null);

  const handleSubmit = async (text: string, theme: string) => {
    if (!text.trim() || !user) return;
    setIsGrading(true);
    setResult(null);

    try {
      const { data: calibration } = await supabase
        .from("user_calibration").select("*").eq("user_id", user.id).maybeSingle();

      console.log("[Correção] Enviando texto", {
        themeLength: theme.length,
        essayChars: text.length,
        essayLines: text.split("\n").length,
        mode: selectedMode?.name || "ENEM Padrão",
      });

      const { data, error } = await supabase.functions.invoke("corrigir-redacao", {
        body: {
          essay: text,
          theme,
          mode_prompt: selectedMode?.system_prompt || undefined,
          mode_name: selectedMode?.name || "ENEM Padrão",
          calibration: calibration ? {
            custom_criteria: calibration.custom_criteria,
            preferred_tone: calibration.preferred_tone,
            common_feedback_patterns: calibration.common_feedback_patterns,
            additional_instructions: calibration.additional_instructions,
          } : undefined,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Erro ao corrigir.");
        return;
      }

      setResult(data as GradingResult);
      console.log("[Correção] Resultado", { total_score: (data as GradingResult)?.total_score });

      // Award XP based on score
      const totalScore = (data as GradingResult)?.total_score || 0;
      const xpEarned = 50 + Math.floor(totalScore / 10);
      const pointsEarned = 30 + Math.floor(totalScore / 20);

      await supabase.rpc("award_xp", {
        _user_id: user.id,
        _xp: xpEarned,
        _points: pointsEarned,
      });

      await supabase.from("correction_history").insert({
        user_id: user.id,
        theme,
        essay_text: text,
        mode_name: selectedMode?.name || "ENEM Padrão",
        result_json: data,
      });

      await refetch();
      toast.success(`+${xpEarned} XP · +${pointsEarned} pontos`, {
        icon: "⚡",
        description: `Nota ${totalScore} · sequência mantida!`,
      });
    } catch (e) {
      console.error("[Correção] Exceção", e);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Estúdio de Redação</h1>
          <p className="text-sm text-muted-foreground">Escreva, envie e ganhe XP a cada correção.</p>
        </div>
        <div className="hidden md:block">
          <Mascot size={80} mood="focus" />
        </div>
      </div>

      <section><OCRSplitView onTextExtracted={setEssayTextFromOCR} /></section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
            Modo de Correção
          </label>
          <CorrectionModeSelector value={selectedMode} onChange={setSelectedMode} />
        </div>
        <div className="md:col-span-2"><CalibrationPanel /></div>
      </section>

      <section><EssayEditor onSubmit={handleSubmit} initialText={essayTextFromOCR} /></section>

      {isGrading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 rounded-2xl glass px-6 py-4">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-mono-score text-xs uppercase tracking-widest text-muted-foreground">
              Analisando redação...
            </span>
          </div>
        </div>
      )}

      {result && !isGrading && <GradingResults result={result} />}
    </div>
  );
};

export default Studio;
