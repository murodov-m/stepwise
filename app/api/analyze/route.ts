import { NextResponse } from "next/server";
import { createLiveProviderFromEnv } from "@/lib/server/live-provider";
import { processLiveDocument } from "@/lib/server/process-document";
import { AnalysisValidationError, AnalysisTimeoutError, ExtractionError, LiveProviderError, UploadValidationError, boundedOperation } from "@/lib/server/errors";
import { validateUploadedDocument, MAX_FILE_SIZE } from "@/lib/server/extract-document";
import { processSample } from "@/lib/server/sample-processor";
export const runtime = "nodejs";
const MAX_BODY_SIZE = MAX_FILE_SIZE + 64*1024;
class RequestTooLarge extends Error {}
async function boundedForm(request: Request): Promise<FormData> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_SIZE)) throw new RequestTooLarge();
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new UploadValidationError("Send a document using the upload form.");
  if (!request.body) throw new UploadValidationError("Choose a document to analyze.");
  return boundedOperation(async (signal) => {
    const reader = request.body!.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    const cancel = () => { void reader.cancel().catch(() => {}); };
    signal.addEventListener("abort", cancel, {once: true});
    try {
      for (;;) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > MAX_BODY_SIZE) throw new RequestTooLarge(); chunks.push(chunk.value); }
    } finally { signal.removeEventListener("abort", cancel); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    try { return await new Response(Buffer.concat(chunks), {headers: {"content-type": request.headers.get("content-type")!}}).formData(); }
    catch { throw new UploadValidationError("The upload form could not be read. Choose the document again."); }
  }, request.signal);
}
export async function POST(request: Request) {
  try {
    const form = await boundedForm(request);
    const mode = form.get("mode");
    if (mode === "sample") return NextResponse.json(processSample("benefits-renewal"));
    if (mode !== "live") return NextResponse.json({code: "MODE_INVALID", message: "Choose the sample or live document mode."}, {status: 400});
    const file = form.get("file");
    if (!(file instanceof File)) throw new UploadValidationError("Choose a document to analyze.");
    if (!file.size || file.size > MAX_FILE_SIZE) throw new UploadValidationError("Choose a nonempty document no larger than 8 MB.");
    const document = {name: file.name, mimeType: file.type, bytes: new Uint8Array(await file.arrayBuffer())};
    validateUploadedDocument(document);
    const provider = createLiveProviderFromEnv(process.env);
    if (!provider) return NextResponse.json({code: "LIVE_MODE_UNAVAILABLE", message: "Live mode is not configured. Try the sample instead."}, {status: 503});
    return NextResponse.json(await processLiveDocument(document, provider, undefined, request.signal));
  } catch (error) {
    if (error instanceof RequestTooLarge) return NextResponse.json({code: "UPLOAD_TOO_LARGE", message: "The upload exceeds 8 MB. Choose a smaller document."}, {status: 413});
    if (error instanceof UploadValidationError) return NextResponse.json({code: error.code, message: error.message}, {status: 400});
    if (error instanceof ExtractionError) return NextResponse.json({code: error.code, message: error.message}, {status: 422});
    if (error instanceof AnalysisTimeoutError) return NextResponse.json({code: error.code, message: error.message}, {status: 504});
    if (error instanceof AnalysisValidationError) return NextResponse.json({code: error.code, message: "The analysis could not be verified. Try again or use the sample."}, {status: 422});
    if (error instanceof LiveProviderError) return NextResponse.json({code: error.code, message: "The live analysis service is unavailable. Try again or use the sample."}, {status: 502});
    return NextResponse.json({code: "REQUEST_FAILED", message: "The request could not be completed. Try again or use the sample."}, {status: 500});
  }
}
