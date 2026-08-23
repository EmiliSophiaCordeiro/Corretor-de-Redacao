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
  const competencies = result?.competencies ?? ({} as GradingResult["competencies"]);
  const errors = Array.isArray(result?.specific_errors) ? result.specific_errors : [];
  const strengths = Array.isArray(result?.strengths) ? result.strengths : [];
  const suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
  const analysisSeconds =
    typeof result?.analysis_ms === "number" && result.analysis_ms > 0
      ? (result.analysis_ms / 1000).toFixed(1)
      : null;

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
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
          {result.mode_name && <span>{result.mode_name}</span>}
          {analysisSeconds && <span>Análise em {analysisSeconds}s</span>}
          {result.analyzed_at && (
            <span>{new Date(result.analyzed_at).toLocaleString("pt-BR")}</span>
          )}
        </div>
      </div>

      {/* Competency Grid */}
      <div>
        <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Competências
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(competencies) as [string, { score: number; justification: string }][]).map(
            ([id, data]) => (
              <CompetencyCard
                key={id}
                id={id.toUpperCase()}
                label={competencyLabels[id] ?? id.toUpperCase()}
                data={data}
              />
            )
          )}
        </div>
      </div>

      {/* C5 Checklist */}
      <C5Checklist checklist={result.c5_checklist} />

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-5">
          <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-success mb-3">
            Pontos Positivos
          </h2>
          <ul className="space-y-2 list-none p-0">
            {strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                <span aria-hidden="true" className="text-success">✔</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specific Errors */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Erros Específicos
          </h2>
          <span className="font-mono-score text-[10px] rounded-sm bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5">
            {errors.length} encontrados
          </span>
        </div>
        {errors.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Nenhum erro relevante foi apontado nesta correção.
          </p>
        ) : (
          <div className="space-y-3">
            {errors.map((error, i) => (
              <ErrorCard key={i} error={error} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
            Sugestões de Melhoria
          </h2>
          <ol className="space-y-2 list-decimal pl-5">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed">{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Overall Verdict */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <span className="font-mono-score text-[10px] uppercase tracking-[0.3em] text-destructive block mb-3">
          Conclusão
        </span>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{result.overall_verdict}</p>
      </div>
    </div>
  );
};


export default GradingResults;
