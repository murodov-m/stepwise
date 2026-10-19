import { createSampleResult } from "@/lib/domain/sample-fixture";
import { getLocalCalendarDate } from "@/lib/domain/deadlines";
import type { AnalysisResult } from "@/lib/domain/schema";
import { validateAnalysisResult } from "@/lib/server/evidence";
import { UploadValidationError } from "@/lib/server/errors";

export function processSample(sampleId: "benefits-renewal", today = getLocalCalendarDate()): AnalysisResult {
  if (sampleId !== "benefits-renewal") {
    throw new Error(`Unknown sample: ${sampleId}`);
  }
  let sample: AnalysisResult;
  try { sample = createSampleResult(today); }
  catch (error) {
    if (error instanceof RangeError) throw new UploadValidationError("The sample date is invalid. Refresh the page and try the sample again.");
    throw error;
  }
  return validateAnalysisResult(sample, sample.evidence);
}
