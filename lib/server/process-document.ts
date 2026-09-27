import type { AnalysisResult } from "@/lib/domain/schema";
import { AnalysisValidationError, AnalysisTimeoutError, LiveProviderError, boundedOperation } from "@/lib/server/errors";
import { validateAnalysisResult } from "@/lib/server/evidence";
import type { LiveProvider } from "@/lib/server/live-provider";
import { extractDocument, type UploadedDocument, type DocumentExtractor } from "@/lib/server/extract-document";

export type { UploadedDocument } from "@/lib/server/extract-document";

export async function processLiveDocument(document: UploadedDocument, provider: LiveProvider, extractor: DocumentExtractor = extractDocument, requestSignal?: AbortSignal): Promise<AnalysisResult> {
  const extracted = await boundedOperation(signal => extractor(document, signal), requestSignal);
  try {
    const response = await boundedOperation(signal => provider.analyze({name: document.name, segments: extracted.segments}, signal), requestSignal);
    const result = validateAnalysisResult(response, extracted.segments);
    return {...result, warnings: [...result.warnings, ...extracted.warnings],
      findings: extracted.requiresConfirmation ? result.findings.map(finding => ({...finding, status: "needs_confirmation"})) : result.findings,
      actions: extracted.requiresConfirmation ? result.actions.map(action => ({...action, evidenceStatus: "needs_confirmation"})) : result.actions};
  } catch (error) {
    if (error instanceof LiveProviderError || error instanceof AnalysisValidationError || error instanceof AnalysisTimeoutError) {
      throw error;
    }
    throw new LiveProviderError("The document could not be analyzed safely");
  }
}
