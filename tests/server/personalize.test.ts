import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { prioritizeActions } from "@/lib/domain/personalize";
import { validateAnalysisResult } from "@/lib/server/evidence";

describe("action prioritization", () => {
  it("keeps document order when no priority is selected", () => {
    expect(prioritizeActions(sampleResult.actions).map((action) => action.id)).toEqual(["check-details", "gather-documents", "submit-review"]);
  });

  it("moves the action linked to the selected priority first", () => {
    expect(prioritizeActions(sampleResult.actions, "gather-documents").map((action) => action.id)).toEqual(["gather-documents", "check-details", "submit-review"]);
  });

  it("uses every generic selected option to order the validated plan", () => {
    const result = validateAnalysisResult({ ...sampleResult, questions: [{ id: "contact-ready", prompt: "Have you contacted the office?", options: ["Yes", "No"], optionActions: { Yes: "submit-review", No: "gather-documents" } }] }, sampleResult.evidence);
    expect(prioritizeActions(result.actions, result.questions, { "contact-ready": "Yes" }).map(action => action.id)).toEqual(["submit-review", "check-details", "gather-documents"]);
    expect(prioritizeActions(result.actions, result.questions, { "contact-ready": "No" }).map(action => action.id)).toEqual(["gather-documents", "check-details", "submit-review"]);
    expect(prioritizeActions(result.actions, result.questions, { "contact-ready": "Unlisted" }).map(action => action.id)).toEqual(["check-details", "gather-documents", "submit-review"]);
  });

  it("keeps the sample address No guidance without masking readiness priority", () => {
    const actions = prioritizeActions(sampleResult.actions, sampleResult.questions, { address: "No", "documents-ready": "Yes" });
    expect(actions.map(action => action.id)).toEqual(["submit-review", "check-details", "gather-documents"]);
    expect(actions[1].reason).toContain("address is unchanged");
    expect(actions[2].reason).toContain("check their dates before submitting");
  });
});
