import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Sparkles, GraduationCap, Palette, Settings2 } from "lucide-react";

export interface CorrectionMode {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  tone: string | null;
  is_builtin: boolean;
}

interface Props {
  value: CorrectionMode | null;
  onChange: (mode: CorrectionMode) => void;
}

const modeIcons: Record<string, React.ReactNode> = {
  "ENEM Padrão": <Sparkles className="h-4 w-4" />,
  "Acadêmico/Formal": <GraduationCap className="h-4 w-4" />,
  "Escrita Criativa": <Palette className="h-4 w-4" />,
};

const CorrectionModeSelector = ({ value, onChange }: Props) => {
  const [modes, setModes] = useState<CorrectionMode[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchModes = async () => {
      const { data } = await supabase
        .from("correction_modes")
        .select("*")
        .order("is_builtin", { ascending: false })
        .order("name");
      if (data) {
        setModes(data as CorrectionMode[]);
        if (!value && data.length > 0) {
          onChange(data[0] as CorrectionMode);
        }
      }
    };
    fetchModes();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {value ? modeIcons[value.name] || <Settings2 className="h-4 w-4" /> : null}
          <span className="font-mono-score text-xs uppercase tracking-wider">
            {value?.name || "Selecionar modo"}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-border bg-card shadow-lg z-20 overflow-hidden">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => { onChange(mode); setOpen(false); }}
              className={`w-full text-left px-3 py-3 hover:bg-accent transition-colors border-b border-border last:border-0 ${
                value?.id === mode.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {modeIcons[mode.name] || <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{mode.name}</span>
                {mode.is_builtin && (
                  <span className="font-mono-score text-[9px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Padrão
                  </span>
                )}
              </div>
              {mode.description && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">{mode.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorrectionModeSelector;
