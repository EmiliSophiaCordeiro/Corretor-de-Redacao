import { useState } from "react";
import EssayEditor from "@/components/EssayEditor";
import GradingResults from "@/components/GradingResults";
import { mockResult } from "@/data/mockResult";
import { GradingResult } from "@/lib/types";
import { FileText, Shield } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState<GradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    setIsGrading(true);
    // Simulate grading delay
    setTimeout(() => {
      setResult(mockResult);
      setIsGrading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-mono-score text-[10px] uppercase tracking-wider">
              Modo Carrasco
            </span>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Editor */}
        <section>
          <EssayEditor onSubmit={handleSubmit} />
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
