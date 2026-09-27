import { sampleResult } from "@/lib/domain/sample-fixture";
import type { AnalysisResult } from "@/lib/domain/schema";
import { validateAnalysisResult } from "@/lib/server/evidence";

export function processSample(sampleId: "benefits-renewal"): AnalysisResult {
  if (sampleId !== "benefits-renewal") {
    throw new Error(`Unknown sample: ${sampleId}`);
  }
  return validateAnalysisResult(sampleResult, sampleResult.evidence);
}
