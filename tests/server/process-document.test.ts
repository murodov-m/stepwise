import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { LiveProviderError } from "@/lib/server/errors";
import { processLiveDocument } from "@/lib/server/process-document";

const document = {
  name: "notice.txt",
  mimeType: "text/plain",
  bytes: new TextEncoder().encode(sampleResult.evidence[0].text),
};

describe("live document processing", () => {
  it("validates a provider result before returning it", async () => {
    const result = await processLiveDocument(document, { analyze: async () => sampleResult });
    expect(result.summary).toContain("annual benefits review");
  });

  it("rejects a provider response with missing evidence", async () => {
    const invalid = structuredClone(sampleResult);
    invalid.actions[0].evidence = [];
    await expect(processLiveDocument(document, { analyze: async () => invalid })).rejects.toThrow();
  });

  it("turns provider errors into a typed error", async () => {
    await expect(processLiveDocument(document, { analyze: async () => { throw new Error("upstream unavailable"); } })).rejects.toBeInstanceOf(LiveProviderError);
  });
});
