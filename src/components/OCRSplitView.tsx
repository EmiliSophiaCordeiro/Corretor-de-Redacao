import { Camera, Upload, X, Loader2, ImageIcon, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onTextExtracted: (text: string) => void;
}

const loadingMessages = [
  "Lendo caligrafia e adaptando ao seu estilo...",
  "Identificando caracteres manuscritos...",
  "Processando parágrafos...",
  "Refinando transcrição...",
];

const OCRSplitView = ({ onTextExtracted }: Props) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [lineCount, setLineCount] = useState<number | null>(null);
  const [lowConfWords, setLowConfWords] = useState<string[]>([]);
  const [ocrNotes, setOcrNotes] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | null>(null);

  const startLoadingAnimation = () => {
    setLoadingMsg(0);
    intervalRef.current = window.setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
  };

  const stopLoadingAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
    setExtractedText(null);
    setConfidence(null);
    setLineCount(null);
    setLowConfWords([]);
    setOcrNotes("");
    startLoadingAnimation();

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);

      try {
        const { data, error } = await supabase.functions.invoke("ocr-redacao", {
          body: { image: base64 },
        });

        if (error || data?.error) {
          toast.error(data?.error || "Erro ao digitalizar a redação.");
          return;
        }

        if (data?.text) {
          setExtractedText(data.text);
          setConfidence(typeof data.confidence === "number" ? data.confidence : null);
          setLineCount(typeof data.line_count === "number" ? data.line_count : null);
          setLowConfWords(Array.isArray(data.low_confidence_words) ? data.low_confidence_words : []);
          setOcrNotes(typeof data.notes === "string" ? data.notes : "");
          onTextExtracted(data.text);
          const conf = typeof data.confidence === "number" ? ` · ${data.confidence}% confiança` : "";
          const lc = typeof data.line_count === "number" ? ` · ${data.line_count} linhas` : "";
          toast.success(`Redação digitalizada${conf}${lc}`);
          if (typeof data.confidence === "number" && data.confidence < 70) {
            toast.warning("Confiança baixa — revise a transcrição antes de enviar.");
          }
        }
      } catch (e) {
        console.error("OCR error:", e);
        toast.error("Erro inesperado ao digitalizar. Tente uma foto mais nítida.");
      } finally {
        setIsScanning(false);
        stopLoadingAnimation();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const clear = () => {
    setPreviewImage(null);
    setExtractedText(null);
  };

  if (!previewImage) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed border-border bg-card/50 p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Camera className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Digitalizar redação manuscrita
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tire uma foto ou arraste a imagem aqui • Máximo 10MB
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors">
              <Camera className="h-3.5 w-3.5" />
              Câmera
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Galeria
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Digitalização OCR
        </span>
        <button onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: Original Image */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">
              Imagem Original
            </span>
          </div>
          <div className="rounded-md border border-border overflow-hidden bg-muted/20">
            <img
              src={previewImage}
              alt="Redação escaneada"
              className="w-full max-h-[400px] object-contain"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Camera className="h-3 w-3" />
            Trocar imagem
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Right: Extracted Text */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">
              Texto Extraído
            </span>
          </div>

          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="font-mono-score text-xs text-muted-foreground text-center animate-pulse max-w-[200px]">
                {loadingMessages[loadingMsg]}
              </p>
            </div>
          ) : extractedText ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-score uppercase tracking-wider">
                {confidence !== null && (
                  <span
                    className={`rounded px-2 py-0.5 border ${
                      confidence >= 80
                        ? "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10"
                        : confidence >= 60
                        ? "border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
                        : "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
                    }`}
                  >
                    {confidence}% confiança
                  </span>
                )}
                {lineCount !== null && (
                  <span className="rounded px-2 py-0.5 border border-border text-muted-foreground">
                    {lineCount} linhas
                  </span>
                )}
              </div>
              <div className="rounded-md border border-border bg-muted/10 p-3 max-h-[360px] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono-score leading-relaxed">
                  {extractedText}
                </pre>
              </div>
              {lowConfWords.length > 0 && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2">
                  <p className="text-[10px] font-mono-score uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-1">
                    Palavras incertas — revise
                  </p>
                  <p className="text-xs text-foreground/80">{lowConfWords.join(" · ")}</p>
                </div>
              )}
              {ocrNotes && (
                <p className="text-[11px] text-muted-foreground italic">{ocrNotes}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Revise a transcrição abaixo antes de enviar para correção. Edite no editor se necessário.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground/40">
              <p className="text-xs">Nenhum texto extraído ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRSplitView;
