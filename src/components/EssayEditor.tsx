import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface EssayEditorProps {
  onSubmit: (text: string, theme: string) => void;
  initialText?: string | null;
}

const MAX_LINES = 30;

const EssayEditor = ({ onSubmit, initialText }: EssayEditorProps) => {
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const lines = text.split("\n");
  const lineCount = lines.length;
  const charCount = text.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.split("\n").length <= MAX_LINES) {
      setText(value);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Theme input */}
      <div className="border-b border-border px-4 py-3">
        <label className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
          Tema da Redação
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Ex: A persistência da violência contra a mulher na sociedade brasileira"
          className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse-red" />
          <span className="font-mono-score text-xs text-muted-foreground uppercase tracking-widest">
            Folha de Redação — ENEM
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono-score text-xs text-muted-foreground">
            Linhas: {lineCount}/{MAX_LINES}
          </span>
          <span className="font-mono-score text-xs text-muted-foreground">
            Caracteres: {charCount}
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 border-r border-border bg-muted/30 pointer-events-none overflow-hidden"
        >
          <div className="pt-4 pb-4">
            {Array.from({ length: MAX_LINES }, (_, i) => (
              <div
                key={i}
                className={`font-mono-score text-xs text-right pr-3 h-7 leading-7 ${
                  i < lineCount ? "text-muted-foreground/60" : "text-muted-foreground/20"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder="Cole ou digite sua redação aqui..."
          className="w-full min-h-[calc(30*1.75rem+2rem)] resize-none bg-transparent pl-16 pr-4 pt-4 pb-4 font-mono-score text-sm leading-7 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 border-none"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Mínimo 7 linhas • Máximo 30 linhas • Texto dissertativo-argumentativo
        </p>
        <button
          onClick={() => onSubmit(text, theme)}
          disabled={lineCount < 7 || !theme.trim()}
          className="rounded-md bg-primary px-6 py-2 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed glow-blue"
        >
          Avaliar Redação
        </button>
      </div>
    </div>
  );
};

export default EssayEditor;
