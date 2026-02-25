import { CompetencyScore } from "@/lib/types";

interface CompetencyCardProps {
  id: string;
  label: string;
  data: CompetencyScore;
}

const getScoreColor = (score: number) => {
  if (score >= 160) return "score-high";
  if (score >= 120) return "score-mid";
  return "score-low";
};

const getLevel = (score: number) => {
  return score / 40;
};

const getLevelBar = (score: number) => {
  const level = getLevel(score);
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((l) => (
        <div
          key={l}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            l <= level
              ? score >= 160
                ? "bg-success"
                : score >= 120
                ? "bg-warning"
                : "bg-destructive"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

const CompetencyCard = ({ id, label, data }: CompetencyCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-muted-foreground/30">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
            {id}
          </span>
          <h3 className="text-sm font-medium text-foreground mt-0.5">{label}</h3>
        </div>
        <div className="text-right">
          <span className={`font-mono-score text-2xl font-bold ${getScoreColor(data.score)}`}>
            {data.score}
          </span>
          <span className="font-mono-score text-xs text-muted-foreground">/200</span>
        </div>
      </div>

      <div className="mb-3">
        <span className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
          Nível {getLevel(data.score)}: {data.score}/200
        </span>
        {getLevelBar(data.score)}
      </div>

      <p className="text-xs leading-relaxed text-secondary-foreground">{data.justification}</p>
    </div>
  );
};

export default CompetencyCard;
