import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const ACCEPTED_UPLOAD =
  "image/png,image/jpeg,image/jpg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx,.png,.jpg,.jpeg";

export type ImportedDocument =
  | { kind: "text"; text: string; source: "pdf" | "docx" }
  | { kind: "image"; file: File; source: "pdf" };

const extOf = (name: string) => name.toLowerCase().split(".").pop() || "";

export const isImageFile = (file: File) =>
  file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(extOf(file.name));

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || extOf(file.name) === "pdf";

export const isDocxFile = (file: File) =>
  file.type.includes("wordprocessingml") || extOf(file.name) === "docx";

const cleanText = (raw: string) =>
  raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await (mammoth as any).extractRawText({ arrayBuffer });
  return cleanText(String(value || ""));
}

async function extractPdf(file: File): Promise<ImportedDocument> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";
  const maxPages = Math.min(pdf.numPages, 5);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    text += `${pageText}\n\n`;
  }

  const cleaned = cleanText(text);
  if (cleaned.length >= 200) {
    return { kind: "text", text: cleaned, source: "pdf" };
  }

  // Scanned PDF: rasterize the first page and hand it to the OCR pipeline.
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("falha ao converter PDF"))), "image/jpeg", 0.92),
  );
  return {
    kind: "image",
    source: "pdf",
    file: new File([blob], file.name.replace(/\.pdf$/i, "") + ".jpg", { type: "image/jpeg" }),
  };
}

/** Converts a PDF or DOCX upload into text (or into an image for OCR). */
export async function importDocument(file: File): Promise<ImportedDocument> {
  if (isDocxFile(file)) {
    return { kind: "text", text: await extractDocx(file), source: "docx" };
  }
  if (isPdfFile(file)) {
    return await extractPdf(file);
  }
  throw new Error("Formato não suportado.");
}
