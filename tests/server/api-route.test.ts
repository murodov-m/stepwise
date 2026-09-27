import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { sampleResult } from "@/lib/domain/sample-fixture";

beforeEach(() => {
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_MODEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("analyze route", () => {
  it("returns the sample without a provider key", async () => {
    const form = new FormData();
    form.set("mode", "sample");
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    expect(response.status).toBe(200);
    expect((await response.json()).summary).toBe(sampleResult.summary);
  });

  it("returns a safe configuration error for live mode without a key", async () => {
    const form = new FormData();
    form.set("mode", "live");
    form.set("file", new File(["notice"], "notice.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("LIVE_MODE_UNAVAILABLE");
  });
});
