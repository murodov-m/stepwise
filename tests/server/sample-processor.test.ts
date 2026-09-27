import { describe, expect, it } from "vitest";
import { processSample } from "@/lib/server/sample-processor";

describe("sample processor", () => {
  it("returns a validated benefits-renewal plan", () => {
    expect(processSample("benefits-renewal").evidence[0].id).toBe("source-1");
  });
});
