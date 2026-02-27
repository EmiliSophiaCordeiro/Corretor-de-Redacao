import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EssayEditorProps {
  onSubmit: (text: string, theme: string) => void;
}

const MAX_LINES = 30;

const EssayEditor = ({ onSubmit }: EssayEditorProps) => {
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = text.split("\n");
  const lineCount = lines.length;
  const charCount = text.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const newLines = value.split("\n");
    if (newLines.length <= MAX_LINES) {
      setText(value);
    }
  };

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, envie apenas imagens.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }

    setIsScanning(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);

      try {
        const { data, error } = await supabase.functions.invoke("ocr-redacao", {
          body: { image: base64 },
        });

        if (error) {
          console.error("OCR error:", error);
          toast.error("Erro ao digitalizar a redação.");
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          return;
        }

        if (data?.text) {
          // Truncate to MAX_LINES
          const ocrLines = data.text.split("\n").slice(0, MAX_LINES);
          setText(ocrLines.join("\n"));
          toast.success("Redação digitalizada com sucesso!");
        }
      } catch (e) {
        console.error("OCR unexpected error:", e);
        toast.error("Erro inesperado ao digitalizar.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setPreviewImage(null);
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
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-1.5 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Digitalizar redação a partir de foto"
          >
            {isScanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isScanning ? "Digitalizando..." : "Escanear"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="h-3 w-px bg-border" />
          <span className="font-mono-score text-xs text-muted-foreground">
            Linhas: {lineCount}/{MAX_LINES}
          </span>
          <span className="font-mono-score text-xs text-muted-foreground">
            Caracteres: {charCount}
          </span>
        </div>
      </div>

      {/* Image preview */}
      {previewImage && (
        <div className="border-b border-border px-4 py-3 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">
              Imagem digitalizada
            </span>
            <button onClick={clearImage} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <img
            src={previewImage}
            alt="Redação escaneada"
            className="max-h-40 rounded border border-border object-contain"
          />
        </div>
      )}

      <div
        className="relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
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
          placeholder="Cole, digite ou escaneie sua redação aqui..."
          className="w-full min-h-[calc(30*1.75rem+2rem)] resize-none bg-transparent pl-16 pr-4 pt-4 pb-4 font-mono-score text-sm leading-7 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 border-none"
          spellCheck={false}
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="font-mono-score text-xs uppercase tracking-widest text-muted-foreground">
              Digitalizando redação...
            </span>
          </div>
        )}
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
