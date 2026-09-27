import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { validateAnalysisResult } from "@/lib/server/evidence";
import { processLiveDocument } from "@/lib/server/process-document";
import { prioritizeActions } from "@/lib/domain/personalize";

describe("trusted processing regressions", () => {
  it("rejects an unrelated upload paired with fabricated sample sources", async () => {
    await expect(processLiveDocument({name: "private.txt", mimeType: "text/plain", bytes: new TextEncoder().encode("An unrelated parking notice.")}, {analyze: async () => sampleResult})).rejects.toThrow();
  });
  it("rejects normalized-empty evidence", () => {
    const result = structuredClone(sampleResult);
    result.actions[0].evidence[0].quote = " \n\t ";
    expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow();
  });
  it("rejects duplicate sources", () => {
    const result = structuredClone(sampleResult);
    result.evidence.push(result.evidence[0]);
    expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow();
  });
  it("rejects impossible dates", () => {
    const result = structuredClone(sampleResult);
    result.actions[0].dueDate = "2026-99-99";
    expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow();
  });
  it("maps the selected priority option to its own action", () => {
    const questions = [{id: "priority", prompt: "Priority?", options: ["Read", "Gather"], optionActions: {Read: "check-details", Gather: "gather-documents"}}];
    expect(prioritizeActions(sampleResult.actions, questions, {priority: "Gather"})[0].id).toBe("gather-documents");
  });
});
