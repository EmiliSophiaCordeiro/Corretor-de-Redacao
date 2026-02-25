import { GradingResult } from "@/lib/types";
import CompetencyCard from "./CompetencyCard";
import ErrorCard from "./ErrorCard";
import C5Checklist from "./C5Checklist";

interface GradingResultsProps {
  result: GradingResult;
}

const competencyLabels: Record<string, string> = {
  c1: "Domínio da Norma Culta",
  c2: "Compreensão do Tema e Repertório",
  c3: "Projeto de Texto e Argumentação",
  c4: "Mecanismos de Coesão",
  c5: "Proposta de Intervenção",
};

const getScoreColor = (score: number) => {
  if (score >= 800) return "score-high";
  if (score >= 600) return "score-mid";
  return "score-low";
};

const GradingResults = ({ result }: GradingResultsProps) => {
  return (
    <div className="space-y-6">
      {/* Total Score Header */}
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <span className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
          Nota Final — Simulação Oficial
        </span>
        <div className={`font-mono-score text-6xl font-bold ${getScoreColor(result.total_score)}`}>
          {result.total_score}
        </div>
        <span className="font-mono-score text-sm text-muted-foreground">/1000</span>
      </div>

      {/* Competency Grid */}
      <div>
        <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Competências
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(result.competencies) as [string, { score: number; justification: string }][]).map(
            ([id, data]) => (
              <CompetencyCard
                key={id}
                id={id.toUpperCase()}
                label={competencyLabels[id]}
                data={data}
              />
            )
          )}
        </div>
      </div>

      {/* C5 Checklist */}
      <C5Checklist checklist={result.c5_checklist} />

      {/* Specific Errors */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Erros Específicos
          </h2>
          <span className="font-mono-score text-[10px] rounded-sm bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5">
            {result.specific_errors.length} encontrados
          </span>
        </div>
        <div className="space-y-3">
          {result.specific_errors.map((error, i) => (
            <ErrorCard key={i} error={error} index={i} />
          ))}
        </div>
      </div>

      {/* Overall Verdict */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <span className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-destructive block mb-3">
          Veredito Final
        </span>
        <p className="text-sm leading-relaxed text-foreground">{result.overall_verdict}</p>
      </div>
    </div>
  );
};

export default GradingResults;
