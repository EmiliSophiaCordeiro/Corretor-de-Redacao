import { C5Checklist as C5ChecklistType } from "@/lib/types";
import { Check, X } from "lucide-react";

interface C5ChecklistProps {
  checklist: C5ChecklistType;
}

const items: { key: keyof C5ChecklistType; label: string; description: string }[] = [
  { key: "agent", label: "Agente", description: "Quem executa a ação" },
  { key: "action", label: "Ação", description: "O que será feito" },
  { key: "means_mode", label: "Meio/Modo", description: "Como será feito" },
  { key: "effect", label: "Efeito", description: "Finalidade da ação" },
  { key: "detail", label: "Detalhamento", description: "Elemento substantivo adicional" },
];

const C5Checklist = ({ checklist }: C5ChecklistProps) => {
  const present = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-mono-score text-[10px] uppercase tracking-widest text-muted-foreground">
            Competência 5 — Checklist
          </span>
          <h3 className="text-sm font-medium text-foreground mt-0.5">
            Proposta de Intervenção
          </h3>
        </div>
        <span className={`font-mono-score text-lg font-bold ${present >= 4 ? "score-high" : present >= 3 ? "score-mid" : "score-low"}`}>
          {present}/5
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const passed = checklist[item.key];
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-md border p-3 transition-all ${
                passed
                  ? "border-success/30 bg-success/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm ${
                  passed ? "bg-success" : "bg-destructive"
                }`}
              >
                {passed ? (
                  <Check className="h-3 w-3 text-success-foreground" />
                ) : (
                  <X className="h-3 w-3 text-destructive-foreground" />
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{item.description}</span>
              </div>
              <span
                className={`ml-auto font-mono-score text-[10px] uppercase tracking-wider ${
                  passed ? "text-success" : "text-destructive"
                }`}
              >
                {passed ? "Presente" : "Ausente"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default C5Checklist;
