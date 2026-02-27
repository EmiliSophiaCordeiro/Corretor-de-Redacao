import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Settings, Save, Loader2 } from "lucide-react";

const CalibrationPanel = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState("");
  const [tone, setTone] = useState("strict");
  const [patterns, setPatterns] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_calibration")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setCriteria(data.custom_criteria || "");
        setTone(data.preferred_tone || "strict");
        setPatterns(data.common_feedback_patterns || "");
        setInstructions(data.additional_instructions || "");
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_calibration")
      .upsert({
        user_id: user.id,
        custom_criteria: criteria,
        preferred_tone: tone,
        common_feedback_patterns: patterns,
        additional_instructions: instructions,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      toast.error("Erro ao salvar calibração.");
    } else {
      toast.success("Calibração salva!");
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-mono-score text-xs uppercase tracking-widest text-foreground">
            Calibração do Corretor
          </span>
        </div>
        <span className="font-mono-score text-[10px] text-muted-foreground">
          {open ? "Fechar" : "Configurar"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure como o corretor deve avaliar. Essas instruções são adicionadas ao "cérebro" da IA para adaptar a correção ao seu estilo.
          </p>

          <div>
            <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Critérios Específicos
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Ex: Valorizo muito a coesão entre parágrafos. Penalizo fortemente clichês..."
              rows={3}
              className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Tom da Correção
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="strict">Rigoroso (Modo Carrasco)</option>
              <option value="balanced">Equilibrado</option>
              <option value="encouraging">Encorajador</option>
              <option value="formal">Acadêmico Formal</option>
            </select>
          </div>

          <div>
            <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Padrões de Feedback Comuns
            </label>
            <textarea
              value={patterns}
              onChange={(e) => setPatterns(e.target.value)}
              placeholder="Ex: Sempre mencionar a falta de repertório produtivo. Destacar erros de regência..."
              rows={3}
              className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
              Instruções Adicionais
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Qualquer instrução extra para o corretor IA..."
              rows={2}
              className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:brightness-110 disabled:opacity-50 glow-blue"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar Calibração
          </button>
        </div>
      )}
    </div>
  );
};

export default CalibrationPanel;
