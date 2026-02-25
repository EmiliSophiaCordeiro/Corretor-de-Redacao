import { useState, useRef } from "react";

interface EssayEditorProps {
  onSubmit: (text: string) => void;
}

const MAX_LINES = 30;

const EssayEditor = ({ onSubmit }: EssayEditorProps) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = text.split("\n").length;
  const charCount = text.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split("\n");
    if (lines.length <= MAX_LINES) {
      setText(value);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse-red" />
          <span className="font-mono-score text-xs text-muted-foreground uppercase tracking-widest">
            Folha de Redação — ENEM
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono-score text-xs text-muted-foreground">
          <span>Linhas: {lineCount}/{MAX_LINES}</span>
          <span>Caracteres: {charCount}</span>
        </div>
      </div>

      <div className="relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-border bg-muted/30 pointer-events-none pt-4 pb-4 overflow-hidden">
          {Array.from({ length: MAX_LINES }, (_, i) => (
            <div
              key={i}
              className={`font-mono-score text-xs text-right pr-3 leading-7 ${
                i < lineCount ? "text-muted-foreground/60" : "text-muted-foreground/20"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
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
          onClick={() => onSubmit(text)}
          disabled={lineCount < 7}
          className="rounded-md bg-primary px-6 py-2 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed glow-blue"
        >
          Avaliar Redação
        </button>
      </div>
    </div>
  );
};

export default EssayEditor;
