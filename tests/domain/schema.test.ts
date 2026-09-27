import { describe, expect, it } from "vitest";
import { analysisResultSchema } from "@/lib/domain/schema";
import { sampleResult } from "@/lib/domain/sample-fixture";

describe("analysis result contract", () => {
  it("accepts the deterministic sample", () => {
    expect(analysisResultSchema.parse(sampleResult)).toEqual(sampleResult);
  });

  it("rejects more than three clarification questions", () => {
    const result = {
      ...sampleResult,
      questions: [...sampleResult.questions, ...sampleResult.questions, ...sampleResult.questions, ...sampleResult.questions],
    };
    expect(() => analysisResultSchema.parse(result)).toThrow();
  });
});
