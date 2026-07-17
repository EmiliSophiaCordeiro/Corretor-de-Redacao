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
    const cs = window.getComputedStyle(ta);
    const innerWidth =
      ta.clientWidth -
      parseFloat(cs.paddingLeft || "0") -
      parseFloat(cs.paddingRight || "0");
    mirror.style.width = `${Math.max(0, innerWidth)}px`;
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

  // Sanitize text pasted from Word, Google Docs, PDF, browsers, etc.
  // Goal: keep only the real paragraph structure so the essay occupies
  // roughly the same number of lines as in the source document.
  const sanitizePastedText = (raw: string): string => {
    let s = raw;
    // Normalize all line breaks (\r\n, \r, unicode separators) to \n
    s = s.replace(/\r\n?/g, "\n");
    s = s.replace(/\u2028|\u2029/g, "\n");
    // Remove invisible/zero-width characters commonly injected by Word/GDocs/PDF
    s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\u00AD\uFFFC]/g, "");
    // Convert non-breaking spaces and other unicode spaces to regular spaces
    s = s.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");
    // Tabs -> single space
    s = s.replace(/\t+/g, " ");
    // Collapse runs of spaces
    s = s.replace(/ {2,}/g, " ");
    // Mark real paragraph breaks (blank line separators) with a sentinel
    s = s.replace(/\n[ \t]*\n(?:[ \t]*\n)*/g, "\u0001");
    // Remaining single newlines are soft wraps from PDF/Word -> join with space
    s = s.replace(/\n+/g, " ");
    // Restore real paragraph breaks
    s = s.replace(/\u0001/g, "\n");
    // Trim whitespace at start/end of each line
    s = s
      .split("\n")
      .map((line) => line.replace(/^[ \t]+|[ \t]+$/g, ""))
      .join("\n");
    // Collapse spaces again after trimming
    s = s.replace(/ {2,}/g, " ");
    return s.trim();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboard = e.clipboardData;
    if (!clipboard) return;
    const raw = clipboard.getData("text/plain") ?? "";
    if (!raw) return;
    e.preventDefault();
    const cleaned = sanitizePastedText(raw);
    const ta = e.currentTarget;
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + cleaned + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = start + cleaned.length;
      el.selectionStart = el.selectionEnd = pos;
    });
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
