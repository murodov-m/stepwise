import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { AnalysisValidationError, validateAnalysisResult } from "@/lib/server/evidence";

describe("analysis evidence", () => {
  it("accepts a result whose quotes exist in its source", () => {
    expect(validateAnalysisResult(sampleResult, sampleResult.evidence)).toEqual(sampleResult);
  });

  it("rejects a quote that is not in the declared source", () => {
    const result = structuredClone(sampleResult);
    result.findings[0].evidence[0].quote = "This text does not exist";
    expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow(AnalysisValidationError);
  });

  it("rejects a reference to an unknown source", () => {
    const result = structuredClone(sampleResult);
    result.actions[0].evidence[0].sourceId = "missing-source";
    expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow(AnalysisValidationError);
  });

  it.each([
    { id: "contact-ready", prompt: "Have you contacted the office?", options: ["Yes", "No"] },
    { id: "contact-ready", prompt: "Have you contacted the office?", options: ["Yes", "No"], affectsActionId: "submit-review" },
    { id: "contact-ready", prompt: "Have you contacted the office?", options: ["Yes", "No"], optionActions: { Yes: "submit-review" } },
    { id: "contact-ready", prompt: "Have you contacted the office?", options: ["Yes", "No"], affectsActionId: "submit-review", optionActions: { Yes: "submit-review" } },
    { id: "address", prompt: "Did your address change?", options: ["Yes", "No"], optionActions: { Yes: "check-details" } },
    { id: "address", prompt: "Did your address change?", options: ["Yes", "Later"], affectsActionId: "check-details", optionActions: { Yes: "check-details" } },
    { id: "documents-ready", prompt: "Are your documents ready?", options: ["Yes", "Never"], affectsActionId: "gather-documents", optionActions: { Yes: "submit-review" } },
  ])("rejects a question with an offered choice that has no consumed effect: %j", question => {
    expect(() => validateAnalysisResult({ ...sampleResult, questions: [question] }, sampleResult.evidence)).toThrow(AnalysisValidationError);
  });
});
