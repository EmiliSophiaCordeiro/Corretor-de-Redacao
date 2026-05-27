import { useState, useRef, useEffect, useLayoutEffect } from "react";

interface EssayEditorProps {
  onSubmit: (text: string, theme: string) => void;
  initialText?: string | null;
}

const MAX_LINES = 30;
const LINE_HEIGHT_PX = 28; // 1.75rem @ 16px

const EssayEditor = ({ onSubmit, initialText }: EssayEditorProps) => {
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("");
  const [visualLines, setVisualLines] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const charCount = text.length;

  // Recalculate visual line count whenever text or size changes
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    const ta = textareaRef.current;
    if (!mirror || !ta) return;
    mirror.style.width = `${ta.clientWidth}px`;
    // Trailing newline workaround: a final \n needs an extra rendered line.
    mirror.textContent = text + (text.endsWith("\n") ? " " : "");
    const lines = Math.max(1, Math.round(mirror.scrollHeight / LINE_HEIGHT_PX));
    setVisualLines(text.length === 0 ? 0 : lines);
  }, [text]);

  // Observe textarea width changes (responsive)
  useEffect(() => {
    if (!textareaRef.current) return;
    const ro = new ResizeObserver(() => {
      setText((t) => t); // trigger recompute via effect
    });
    ro.observe(textareaRef.current);
    return () => ro.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const overLimit = visualLines > MAX_LINES;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
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
          <span
            className={`font-mono-score text-xs uppercase tracking-widest ${
              overLimit ? "text-destructive font-semibold" : "text-muted-foreground"
            }`}
          >
            Linhas: {visualLines}/{MAX_LINES}
          </span>
          <span className="font-mono-score text-xs text-muted-foreground">
            Caracteres: {charCount}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 border-r border-border bg-muted/30 pointer-events-none overflow-hidden"
        >
          <div className="pt-4 pb-4">
            {Array.from({ length: MAX_LINES }, (_, i) => (
              <div
                key={i}
                className={`font-mono-score text-xs text-right pr-3 h-7 leading-7 ${
                  i < visualLines ? "text-muted-foreground/70" : "text-muted-foreground/20"
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

        {/* Hidden mirror used to measure visually-wrapped line count */}
        <div
          ref={mirrorRef}
          aria-hidden
          className="font-mono-score text-sm leading-7"
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            top: 0,
            left: -9999,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Mínimo 7 linhas • Máximo 30 linhas • Texto dissertativo-argumentativo
        </p>
        <button
          onClick={() => onSubmit(text, theme)}
          disabled={visualLines < 7 || visualLines > MAX_LINES || !theme.trim()}
          className="rounded-md bg-primary px-6 py-2 font-mono-score text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed glow"
        >
          Avaliar Redação
        </button>
      </div>
    </div>
  );
};

export default EssayEditor;
