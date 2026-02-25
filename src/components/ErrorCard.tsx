import { SpecificError } from "@/lib/types";
import { AlertTriangle, BookOpen, ArrowDown } from "lucide-react";

interface ErrorCardProps {
  error: SpecificError;
  index: number;
}

const getIcon = (type: string) => {
  if (type === "Gramatical") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (type === "Argumentativo") return <BookOpen className="h-4 w-4 text-warning" />;
  return <ArrowDown className="h-4 w-4 text-primary" />;
};

const getTypeBadgeClass = (type: string) => {
  if (type === "Gramatical") return "bg-destructive/10 text-destructive border-destructive/20";
  if (type === "Argumentativo") return "bg-warning/10 text-warning border-warning/20";
  return "bg-primary/10 text-primary border-primary/20";
};

const ErrorCard = ({ error, index }: ErrorCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 glow-red">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{getIcon(error.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono-score text-[10px] text-muted-foreground">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono-score text-[10px] uppercase tracking-wider ${getTypeBadgeClass(error.type)}`}
            >
              {error.type}
            </span>
            <span className="font-mono-score text-[10px] text-muted-foreground">
              {error.location}
            </span>
          </div>

          <p className="text-sm text-foreground mb-3 leading-relaxed">
            {error.technical_description}
          </p>

          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 mb-2">
            <span className="font-mono-score text-[10px] uppercase tracking-widest text-destructive block mb-1">
              Regra INEP Violada
            </span>
            <p className="text-xs text-secondary-foreground">{error.inep_rule}</p>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3">
            <span className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              Critério de Rebaixamento
            </span>
            <p className="text-xs text-secondary-foreground">{error.level_impact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;
