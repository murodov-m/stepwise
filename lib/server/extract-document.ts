import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import type { SourceSegment } from "@/lib/domain/schema";
import { AnalysisTimeoutError, ExtractionError, UploadValidationError, boundedOperation } from "@/lib/server/errors";
import { extractionProcessScript } from "@/lib/server/extraction-worker";

export interface UploadedDocument { name: string; mimeType: string; bytes: Uint8Array }
export interface ExtractedDocument { segments: SourceSegment[]; warnings: string[]; requiresConfirmation: boolean }
export type DocumentExtractor = (document: UploadedDocument, signal?: AbortSignal) => Promise<ExtractedDocument>;
export const MAX_FILE_SIZE = 8*1024*1024;
export const MAX_TEXT_LENGTH = 100000;
// Resolve actual installed files at runtime; Turbopack rewrites static require.resolve
// calls to internal module IDs, which cannot be passed to a separate Node process.
const localRequire = process.getBuiltinModule("module").createRequire(join(process.cwd(), "package.json"));
const allowed = new Set(["text/plain", "application/pdf", "image/png", "image/jpeg", "image/webp"]);
const pdfErrors: Record<string, string> = {
  pdf_pages: "Use a PDF with no more than 40 pages, or paste the relevant pages as text.",
  pdf_no_text: "This PDF contains a page without readable text. Upload a clear image of the notice or paste its text.",
  pdf_length: "This PDF exceeds 100,000 text characters. Upload fewer pages or paste the relevant section.",
  pdf_unreadable: "This PDF is encrypted, corrupt, or unreadable. Export an unlocked text-bearing PDF or paste the text.",
};

async function runOwnedExtractionProcess<T>(workerData: object, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new AnalysisTimeoutError();
  const child = spawn(process.execPath, ["-e", extractionProcessScript], {stdio: ["ignore", "ignore", "ignore", "ipc"], serialization: "advanced", windowsHide: true});
  let cancel: (() => void) | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      cancel = () => {reject(new AnalysisTimeoutError()); child.kill();};
      signal.addEventListener("abort", cancel, {once: true});
      child.once("message", (message: {ok: boolean; result: T; reason?: string}) => message.ok ? resolve(message.result) : reject(new ExtractionError(message.reason ? pdfErrors[message.reason] : undefined)));
      child.once("error", () => reject(new ExtractionError()));
      child.once("exit", () => reject(new ExtractionError()));
      child.send(workerData, error => {if (error) reject(new ExtractionError());});
      if (signal.aborted) cancel();
    });
  } finally {
    if (cancel) signal.removeEventListener("abort", cancel);
    child.kill();
    await new Promise<void>(resolve => {if (child.exitCode !== null || child.signalCode !== null) resolve(); else child.once("exit", () => resolve());});
  }
}

export function validateUploadedDocument(document: UploadedDocument): void {
  const {bytes, mimeType} = document;
  if (!bytes.length || bytes.length > MAX_FILE_SIZE) throw new UploadValidationError("Choose a nonempty document no larger than 8 MB.");
  if (!allowed.has(mimeType)) throw new UploadValidationError("Use a PDF, JPG, PNG, WebP, or plain-text document.");
  const header = Buffer.from(bytes.subarray(0, 12));
  const valid = mimeType === "text/plain" || (mimeType === "application/pdf" && header.subarray(0,5).toString() === "%PDF-") || (mimeType === "image/png" && header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (mimeType === "image/jpeg" && header[0] === 255 && header[1] === 216 && header[2] === 255) || (mimeType === "image/webp" && header.subarray(0,4).toString() === "RIFF" && header.subarray(8,12).toString() === "WEBP");
  if (!valid) throw new UploadValidationError("The file contents do not match the selected format. Choose a valid document or paste its text.");
}
function checkedText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(trimmed)) throw new ExtractionError("The text is blank, unreadable, or exceeds 100,000 characters. Paste a shorter readable section.");
  return trimmed;
}
async function extract(document: UploadedDocument, signal: AbortSignal): Promise<ExtractedDocument> {
  validateUploadedDocument(document);
  if (document.mimeType === "text/plain") {
    let text: string;
    try {text = new TextDecoder("utf-8", {fatal: true}).decode(document.bytes);}
    catch {throw new ExtractionError("Use a UTF-8 plain-text document or paste its text.");}
    return {segments: [{id: "source-1", label: "Uploaded text", text: checkedText(text)}], warnings: [], requiresConfirmation: false};
  }
  if (document.mimeType === "application/pdf") {
    const moduleUrl = pathToFileURL(join(dirname(localRequire.resolve("pdfjs-dist/package.json")), "legacy/build/pdf.mjs")).href;
    const segments = await runOwnedExtractionProcess<SourceSegment[]>({kind: "pdf", moduleUrl, bytes: document.bytes}, signal);
    return {segments: segments.map(segment => ({...segment, text: checkedText(segment.text)})), warnings: [], requiresConfirmation: false};
  }
  const {default: sharp} = await import("sharp");
  const image = sharp(Buffer.from(document.bytes), {limitInputPixels: 16000000, failOn: "warning"});
  let raster: Buffer;
  try {
    const metadata = await image.metadata();
    const expectedFormat = document.mimeType === "image/jpeg" ? "jpeg" : document.mimeType.split("/")[1];
    if (metadata.format !== expectedFormat || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new ExtractionError();
    raster = await image.rotate().flatten({background: "white"}).png().toBuffer();
  } finally {image.destroy();}
  const language = localRequire("@tesseract.js-data/eng") as {langPath: string};
  const data = await runOwnedExtractionProcess<{text: string; confidence: number}>({kind: "ocr", modulePath: localRequire.resolve("tesseract.js"), langPath: language.langPath, image: raster}, signal);
  if (data.confidence < 60 || data.text.trim().length < 20 || !/[A-Za-z]{3}/.test(data.text)) throw new ExtractionError("The image transcription is too uncertain. Upload a sharper English image or paste the text.");
  return {segments: [{id: "source-1", label: "Image transcription", text: checkedText(data.text)}], warnings: ["This image was transcribed with English OCR. Confirm the transcription against your original; source links do not verify OCR accuracy."], requiresConfirmation: true};
}
export const extractDocument: DocumentExtractor = (document, signal) => boundedOperation(async activeSignal => {
  try {return await extract(document, activeSignal);}
  catch (error) {
    if (error instanceof UploadValidationError || error instanceof ExtractionError || error instanceof AnalysisTimeoutError) throw error;
    throw new ExtractionError();
  }
}, signal);
