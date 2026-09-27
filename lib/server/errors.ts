export class AnalysisValidationError extends Error {
  readonly code = "ANALYSIS_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "AnalysisValidationError";
  }
}

export class UploadValidationError extends Error {
  readonly code = "UPLOAD_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export class LiveProviderError extends Error {
  readonly code = "LIVE_PROVIDER_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "LiveProviderError";
  }
}

export class ExtractionError extends Error {
  readonly code = "EXTRACTION_FAILED";
  constructor(message = "Could not read this document. Use a clear English image, text-bearing PDF, or paste the text.") { super(message); this.name = "ExtractionError"; }
}

export class AnalysisTimeoutError extends Error {
  readonly code = "ANALYSIS_TIMEOUT";
  constructor() { super("Processing took too long. Try a smaller document or use the sample."); this.name = "AnalysisTimeoutError"; }
}

export async function boundedOperation<T>(operation: (signal: AbortSignal) => Promise<T>, parentSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  parentSignal?.addEventListener("abort", abort, {once: true});
  if (parentSignal?.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: (() => void) | undefined;
  try {
    return await Promise.race([
      new Promise<T>((_resolve, reject) => {
        rejectAbort = () => reject(new AnalysisTimeoutError());
        controller.signal.addEventListener("abort", rejectAbort, {once: true});
        if (controller.signal.aborted) rejectAbort();
        timer = setTimeout(abort, 30000);
      }),
      Promise.resolve().then(() => {if (controller.signal.aborted) throw new AnalysisTimeoutError(); return operation(controller.signal);}),
    ]);
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abort);
    if (rejectAbort) controller.signal.removeEventListener("abort", rejectAbort);
    controller.abort();
  }
}
