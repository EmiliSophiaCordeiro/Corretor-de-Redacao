import { AlertTriangle, Bug, Camera, FileText, ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onTextExtracted: (text: string) => void;
}

type DebugLog = {
  stage: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
};

type LineBand = {
  y: number;
  height: number;
  inkRatio: number;
};

type OcrDebugState = {
  processedImage: string | null;
  lineOverlayImage: string | null;
  rawOcrText: string;
  finalTextToEditor: string;
  detectedLines: LineBand[];
  logs: DebugLog[];
};

const loadingMessages = [
  "Preparando imagem sem alterar o texto...",
  "Detectando linhas físicas da folha...",
  "Lendo a caligrafia literalmente...",
  "Validando confiança da transcrição...",
];

const LOW_CONFIDENCE_THRESHOLD = 70;

const createLog = (
  stage: string,
  status: DebugLog["status"],
  message: string,
  details?: Record<string, unknown>,
): DebugLog => ({ stage, status, message, details, timestamp: new Date().toISOString() });

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a imagem."));
    img.src = src;
  });

const formatBytes = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

const preprocessImage = async (src: string) => {
  const img = await loadImage(src);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas não disponível para pré-processamento.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const binary = new Uint8Array(width * height);
  const cleaned = new Uint8Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
    const dark = contrast < 178 ? 1 : 0;
    binary[i / 4] = dark;
    cleaned[i / 4] = dark;
  }

  const scanLeft = Math.floor(width * 0.08);
  const scanRight = Math.floor(width * 0.98);
  const scanWidth = Math.max(1, scanRight - scanLeft);
  const ruledRows = new Set<number>();

  for (let y = 0; y < height; y += 1) {
    let darkPixels = 0;
    for (let x = scanLeft; x < scanRight; x += 1) {
      darkPixels += binary[y * width + x];
    }
    if (darkPixels / scanWidth > 0.58) ruledRows.add(y);
  }

  ruledRows.forEach((row) => {
    for (let y = Math.max(0, row - 1); y <= Math.min(height - 1, row + 1); y += 1) {
      for (let x = scanLeft; x < scanRight; x += 1) {
        cleaned[y * width + x] = 0;
      }
    }
  });

  for (let i = 0; i < data.length; i += 4) {
    const ink = cleaned[i / 4] === 1;
    data[i] = ink ? 0 : 255;
    data[i + 1] = ink ? 0 : 255;
    data[i + 2] = ink ? 0 : 255;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const processedImage = canvas.toDataURL("image/jpeg", 0.92);

  const textLeft = Math.floor(width * 0.12);
  const textRight = Math.floor(width * 0.97);
  const textWidth = Math.max(1, textRight - textLeft);
  const rowDensity = new Array<number>(height).fill(0);

  for (let y = 0; y < height; y += 1) {
    let darkPixels = 0;
    for (let x = textLeft; x < textRight; x += 1) {
      darkPixels += cleaned[y * width + x];
    }
    rowDensity[y] = darkPixels / textWidth;
  }

  const smoothed = rowDensity.map((_, y) => {
    let total = 0;
    let count = 0;
    for (let yy = Math.max(0, y - 4); yy <= Math.min(height - 1, y + 4); yy += 1) {
      total += rowDensity[yy];
      count += 1;
    }
    return total / count;
  });

  const threshold = 0.0065;
  const rawBands: Array<{ start: number; end: number; inkRatio: number }> = [];
  let start: number | null = null;
  let maxInk = 0;

  for (let y = 0; y < height; y += 1) {
    if (smoothed[y] > threshold) {
      if (start === null) start = y;
      maxInk = Math.max(maxInk, smoothed[y]);
    } else if (start !== null) {
      if (y - start >= 4) rawBands.push({ start, end: y - 1, inkRatio: maxInk });
      start = null;
      maxInk = 0;
    }
  }
  if (start !== null) rawBands.push({ start, end: height - 1, inkRatio: maxInk });

  const maxGap = Math.max(10, Math.round(height * 0.009));
  const mergedBands: typeof rawBands = [];
  rawBands.forEach((band) => {
    const last = mergedBands[mergedBands.length - 1];
    if (last && band.start - last.end <= maxGap) {
      last.end = band.end;
      last.inkRatio = Math.max(last.inkRatio, band.inkRatio);
    } else {
      mergedBands.push({ ...band });
    }
  });

  const detectedLines = mergedBands
    .filter((band) => band.end - band.start >= 6 && band.end - band.start <= Math.max(90, height * 0.09))
    .slice(0, 40)
    .map((band) => ({
      y: Number((band.start / height).toFixed(4)),
      height: Number(((band.end - band.start + 1) / height).toFixed(4)),
      inkRatio: Number(band.inkRatio.toFixed(4)),
    }));

  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext("2d");
  if (!overlayCtx) throw new Error("Canvas não disponível para depuração.");
  overlayCtx.drawImage(canvas, 0, 0);
  overlayCtx.fillStyle = "rgba(22, 163, 74, 0.14)";
  overlayCtx.strokeStyle = "rgba(22, 163, 74, 0.95)";
  overlayCtx.lineWidth = Math.max(2, Math.round(width / 600));
  overlayCtx.font = `${Math.max(14, Math.round(width / 80))}px monospace`;
  detectedLines.forEach((band, index) => {
    const y = band.y * height;
    const bandHeight = Math.max(8, band.height * height);
    overlayCtx.fillRect(textLeft, y, textRight - textLeft, bandHeight);
    overlayCtx.strokeRect(textLeft, y, textRight - textLeft, bandHeight);
    overlayCtx.fillStyle = "rgba(22, 163, 74, 0.95)";
    overlayCtx.fillText(String(index + 1).padStart(2, "0"), Math.max(6, textLeft - 34), y + Math.min(20, bandHeight));
    overlayCtx.fillStyle = "rgba(22, 163, 74, 0.14)";
  });

  return {
    processedImage,
    lineOverlayImage: overlayCanvas.toDataURL("image/jpeg", 0.9),
    detectedLines,
    dimensions: { originalWidth: img.naturalWidth, originalHeight: img.naturalHeight, width, height, scale },
    removedRuledRows: ruledRows.size,
  };
};

const OCRSplitView = ({ onTextExtracted }: Props) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [lineCount, setLineCount] = useState<number | null>(null);
  const [lowConfWords, setLowConfWords] = useState<string[]>([]);
  const [ocrNotes, setOcrNotes] = useState<string>("");
  const [isLowConfidence, setIsLowConfidence] = useState(false);
  const [debugInfo, setDebugInfo] = useState<OcrDebugState | null>(null);
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
    setIsLowConfidence(false);
    startLoadingAnimation();

    const logs: DebugLog[] = [
      createLog("capture", "ok", "Arquivo recebido do dispositivo.", {
        name: file.name,
        type: file.type,
        size: formatBytes(file.size),
      }),
    ];

    try {
      const base64 = await readFileAsDataUrl(file);
      setPreviewImage(base64);
      logs.push(createLog("capture", "ok", "Imagem convertida para Data URL sem alterar conteúdo.", { chars: base64.length }));

      const processed = await preprocessImage(base64);
      logs.push(
        createLog("preprocess", "ok", "Contraste ajustado e linhas impressas removidas para leitura auxiliar.", {
          ...processed.dimensions,
          removed_ruled_rows: processed.removedRuledRows,
        }),
      );
      logs.push(
        createLog(
          "line_detection",
          processed.detectedLines.length > 0 ? "ok" : "warning",
          `${processed.detectedLines.length} linhas manuscritas detectadas visualmente.`,
          { bands: processed.detectedLines },
        ),
      );

      setDebugInfo({
        processedImage: processed.processedImage,
        lineOverlayImage: processed.lineOverlayImage,
        rawOcrText: "",
        finalTextToEditor: "",
        detectedLines: processed.detectedLines,
        logs: [...logs],
      });

      console.log("[OCR] Enviando imagem", {
        sizeKB: Math.round(base64.length / 1024),
        detectedLines: processed.detectedLines.length,
      });

      const { data, error } = await supabase.functions.invoke("ocr-redacao", {
        body: {
          image: base64,
          processedImage: processed.processedImage,
          expectedLineCount: processed.detectedLines.length || undefined,
          lineBands: processed.detectedLines,
        },
      });

      if (error || data?.error) {
        logs.push(createLog("ocr", "error", data?.error || error?.message || "Erro ao digitalizar a redação."));
        setDebugInfo((current) => ({
          processedImage: current?.processedImage || processed.processedImage,
          lineOverlayImage: current?.lineOverlayImage || processed.lineOverlayImage,
          rawOcrText: data?.raw_ocr_text || "",
          finalTextToEditor: "",
          detectedLines: processed.detectedLines,
          logs: [...logs, ...((data?.debug?.events as DebugLog[] | undefined) || [])],
        }));
        toast.error(data?.error || "Erro ao digitalizar a redação.");
        return;
      }

      const text = typeof data?.text === "string" ? data.text : "";
      const nextConfidence = typeof data?.confidence === "number" ? data.confidence : null;
      const nextLineCount = typeof data?.line_count === "number" ? data.line_count : null;
      const lowConfidence = Boolean(data?.low_confidence) || (nextConfidence !== null && nextConfidence < LOW_CONFIDENCE_THRESHOLD);

      setExtractedText(text || null);
      setConfidence(nextConfidence);
      setLineCount(nextLineCount);
      setLowConfWords(Array.isArray(data?.low_confidence_words) ? data.low_confidence_words : []);
      setOcrNotes(typeof data?.notes === "string" ? data.notes : "");
      setIsLowConfidence(lowConfidence);

      logs.push(
        createLog(lowConfidence ? "final_validation" : "final_validation", lowConfidence ? "warning" : "ok", lowConfidence ? "Transcrição não enviada ao editor por baixa confiança." : "Texto OCR enviado ao editor sem pós-processamento.", {
          confidence: nextConfidence,
          line_count: nextLineCount,
          raw_chars: String(data?.raw_ocr_text || "").length,
          final_chars: text.length,
        }),
      );

      setDebugInfo({
        processedImage: processed.processedImage,
        lineOverlayImage: processed.lineOverlayImage,
        rawOcrText: data?.raw_ocr_text || "",
        finalTextToEditor: lowConfidence ? "" : text,
        detectedLines: processed.detectedLines,
        logs: [...logs, ...((data?.debug?.events as DebugLog[] | undefined) || [])],
      });

      console.log("[OCR] Resposta", { confidence: nextConfidence, lineCount: nextLineCount, lowConfidence });

      if (!text) {
        toast.error("Nenhum texto manuscrito legível foi encontrado. Tire uma nova foto.");
        return;
      }

      if (lowConfidence) {
        toast.warning("Confiança baixa: tire uma nova foto mais nítida antes de corrigir.");
        return;
      }

      onTextExtracted(text);
      const conf = nextConfidence !== null ? ` · ${nextConfidence}% confiança` : "";
      const lc = nextLineCount !== null ? ` · ${nextLineCount} linhas` : "";
      toast.success(`Redação digitalizada${conf}${lc}`);
    } catch (e) {
      console.error("[OCR] Exceção", e);
      logs.push(createLog("exception", "error", e instanceof Error ? e.message : "Erro inesperado."));
      setDebugInfo((current) => ({
        processedImage: current?.processedImage || null,
        lineOverlayImage: current?.lineOverlayImage || null,
        rawOcrText: current?.rawOcrText || "",
        finalTextToEditor: "",
        detectedLines: current?.detectedLines || [],
        logs: [...logs],
      }));
      toast.error("Erro inesperado ao digitalizar. Tente uma foto mais nítida.");
    } finally {
      setIsScanning(false);
      stopLoadingAnimation();
    }
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
    setConfidence(null);
    setLineCount(null);
    setLowConfWords([]);
    setOcrNotes("");
    setIsLowConfidence(false);
    setDebugInfo(null);
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
            <p className="text-sm font-medium text-foreground">Digitalizar redação manuscrita</p>
            <p className="text-xs text-muted-foreground mt-1">Tire uma foto ou arraste a imagem aqui • Máximo 10MB</p>
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
        <span className="font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Digitalização OCR</span>
        <button onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Limpar digitalização">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Imagem Original</span>
          </div>
          <div className="rounded-md border border-border overflow-hidden bg-muted/20">
            <img src={previewImage} alt="Redação escaneada" className="w-full max-h-[400px] object-contain" />
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Camera className="h-3 w-3" />
            Trocar imagem
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Texto Extraído</span>
          </div>

          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="font-mono-score text-xs text-muted-foreground text-center animate-pulse max-w-[240px]">{loadingMessages[loadingMsg]}</p>
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
                {lineCount !== null && <span className="rounded px-2 py-0.5 border border-border text-muted-foreground">{lineCount} linhas OCR</span>}
                {debugInfo?.detectedLines.length ? (
                  <span className="rounded px-2 py-0.5 border border-border text-muted-foreground">{debugInfo.detectedLines.length} linhas detectadas</span>
                ) : null}
              </div>

              {isLowConfidence && (
                <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  <p>A confiança da leitura está baixa. O texto não foi enviado ao editor; tire uma nova foto mais nítida antes de corrigir.</p>
                </div>
              )}

              <div className="rounded-md border border-border bg-muted/10 p-3 max-h-[360px] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono-score leading-relaxed">{extractedText}</pre>
              </div>
              {lowConfWords.length > 0 && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2">
                  <p className="text-[10px] font-mono-score uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-1">Trechos incertos detectados</p>
                  <p className="text-xs text-foreground/80">{lowConfWords.join(" · ")}</p>
                </div>
              )}
              {ocrNotes && <p className="text-[11px] text-muted-foreground italic">{ocrNotes}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground/40">
              <p className="text-xs">Nenhum texto extraído ainda</p>
            </div>
          )}
        </div>
      </div>

      {debugInfo && (
        <details className="border-t border-border bg-muted/10 p-4" open>
          <summary className="flex cursor-pointer items-center gap-2 font-mono-score text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Bug className="h-3.5 w-3.5" />
            Depuração temporária OCR
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-2 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Imagem após pré-processamento</p>
              {debugInfo.processedImage && <img src={debugInfo.processedImage} alt="Imagem pré-processada para OCR" className="max-h-72 w-full rounded-md border border-border object-contain bg-background" />}
            </div>
            <div>
              <p className="mb-2 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Linhas detectadas visualmente</p>
              {debugInfo.lineOverlayImage && <img src={debugInfo.lineOverlayImage} alt="Linhas manuscritas detectadas" className="max-h-72 w-full rounded-md border border-border object-contain bg-background" />}
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Texto bruto retornado pelo OCR</p>
                <pre className="max-h-32 overflow-auto rounded-md border border-border bg-background p-2 text-[11px] text-foreground whitespace-pre-wrap">{debugInfo.rawOcrText || "Aguardando OCR..."}</pre>
              </div>
              <div>
                <p className="mb-2 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Texto final enviado ao editor</p>
                <pre className="max-h-32 overflow-auto rounded-md border border-border bg-background p-2 text-[11px] text-foreground whitespace-pre-wrap">{debugInfo.finalTextToEditor || "Não enviado por baixa confiança ou erro."}</pre>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-border bg-background p-3">
            <p className="mb-2 font-mono-score text-[10px] uppercase tracking-wider text-muted-foreground">Logs do pipeline</p>
            <div className="max-h-52 overflow-auto space-y-2">
              {debugInfo.logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="grid gap-1 border-b border-border/60 pb-2 last:border-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-mono-score uppercase text-foreground">{log.stage}</span>
                    <span className={log.status === "error" ? "text-destructive" : log.status === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>{log.status}</span>
                    <span className="text-muted-foreground">{log.message}</span>
                  </div>
                  {log.details && <pre className="overflow-auto text-[10px] text-muted-foreground">{JSON.stringify(log.details, null, 2)}</pre>}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
};

export default OCRSplitView;
