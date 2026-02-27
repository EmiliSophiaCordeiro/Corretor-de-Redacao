import { useState } from "react";
import EssayEditor from "@/components/EssayEditor";
import GradingResults from "@/components/GradingResults";
import OCRSplitView from "@/components/OCRSplitView";
import CorrectionModeSelector, { CorrectionMode } from "@/components/CorrectionModeSelector";
import CalibrationPanel from "@/components/CalibrationPanel";
import { GradingResult } from "@/lib/types";
import { FileText, Shield, LogOut, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [result, setResult] = useState<GradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<CorrectionMode | null>(null);
  const [essayTextFromOCR, setEssayTextFromOCR] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (text: string, theme: string) => {
    if (!text.trim()) return;
    setIsGrading(true);
    setResult(null);

    try {
      // Fetch user calibration
      const { data: calibration } = await supabase
        .from("user_calibration")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

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

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Erro ao corrigir a redação. Tente novamente.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as GradingResult);

      // Save to history
      await supabase.from("correction_history").insert({
        user_id: user.id,
        theme,
        essay_text: text,
        mode_name: selectedMode?.name || "ENEM Padrão",
        result_json: data,
      });
    } catch (e) {
      console.error("Unexpected error:", e);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleOCRText = (text: string) => {
    setEssayTextFromOCR(text);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 border border-destructive/20">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Corretor ENEM
              </h1>
              <p className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
                Avaliação Oficial — Critérios INEP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono-score text-[10px] text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* OCR Split View */}
        <section>
          <OCRSplitView onTextExtracted={handleOCRText} />
        </section>

        {/* Mode Selector + Calibration */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
              Modo de Correção
            </label>
            <CorrectionModeSelector value={selectedMode} onChange={setSelectedMode} />
          </div>
          <div className="md:col-span-2">
            <CalibrationPanel />
          </div>
        </section>

        {/* Editor */}
        <section>
          <EssayEditor onSubmit={handleSubmit} initialText={essayTextFromOCR} />
        </section>

        {/* Loading */}
        {isGrading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-6 py-4">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse-red" />
              <span className="font-mono-score text-xs uppercase tracking-widest text-muted-foreground">
                Analisando redação com rigor máximo...
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isGrading && <GradingResults result={result} />}
      </main>

      <footer className="border-t border-border py-4 mt-12">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <p className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
            Simulação baseada nos critérios oficiais do INEP • Não substitui correção humana
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
