import { afterEach, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "@/lib/server/live-provider";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { processLiveDocument } from "@/lib/server/process-document";
import { POST } from "@/app/api/analyze/route";

afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers();});
it("sends extracted sources and the complete schema, never raw files or names", async () => {
  let requestBody = "";
  let signal: AbortSignal | undefined;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    requestBody = String(init.body); signal = init.signal as AbortSignal;
    return Response.json({choices: [{message: {content: JSON.stringify(sampleResult)}}]});
  });
  const provider = new OpenAICompatibleProvider({apiKey: "private-key", baseUrl: "https://test.invalid/v1", model: "test-model"});
  const controller = new AbortController();
  await provider.analyze({name: "SECRET-FILENAME.pdf", segments: sampleResult.evidence}, controller.signal);
  expect(requestBody).toContain("optionActions");
  expect(requestBody).toContain("dueKind");
  expect(requestBody).toContain("evidenceStatus");
  expect(requestBody).toContain("source-1");
  expect(requestBody).not.toContain("SECRET-FILENAME");
  expect(requestBody).not.toContain("file_data");
  expect(signal).toBeDefined();
});
it("bounds provider time and aborts even when a provider ignores cancellation", async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  const promise = processLiveDocument({name: "secret.txt", mimeType: "text/plain", bytes: new TextEncoder().encode("notice")}, {analyze: async (_document, incoming) => {signal = incoming; return new Promise(() => {});}}, async () => ({segments: sampleResult.evidence, warnings: [], requiresConfirmation: false}));
  const expectation = expect(promise).rejects.toMatchObject({code: "ANALYSIS_TIMEOUT"});
  await vi.advanceTimersByTimeAsync(30001);
  await expectation;
  expect(signal?.aborted).toBe(true);
});
it.each([
  {contents: "   ", mimeType: "text/plain", code: "EXTRACTION_FAILED"},
  {contents: "not-pdf", mimeType: "application/pdf", code: "UPLOAD_INVALID"},
  {contents: "", mimeType: "text/plain", code: "UPLOAD_INVALID"},
])("returns safe blank, corrupt and empty upload errors", async ({contents, mimeType, code}) => {
  vi.stubEnv("AI_API_KEY", "secret-key"); vi.stubEnv("AI_MODEL", "test");
  const form = new FormData(); form.set("mode", "live"); form.set("file", new File([contents], "SECRET-FILENAME", {type: mimeType}));
  const response = await POST(new Request("http://localhost/api/analyze", {method: "POST", body: form}));
  const body = await response.json();
  expect(body.code).toBe(code);
  expect(Object.keys(body).sort()).toEqual(["code", "message"]);
  expect(JSON.stringify(body)).not.toMatch(/SECRET-FILENAME|secret-key/);
});
it("rejects an oversized multipart body before consuming it", async () => {
  let reads = 0;
  const stream = new ReadableStream({pull(controller) { reads++; controller.enqueue(new Uint8Array(1)); controller.close(); }});
  const request = new Request("http://localhost/api/analyze", {method: "POST", body: stream, duplex: "half", headers: {"content-type": "multipart/form-data; boundary=abc", "content-length": String(9*1024*1024)}} as RequestInit);
  const before = reads;
  const response = await POST(request);
  expect(response.status).toBe(413);
  expect(reads).toBeLessThanOrEqual(before+1);
});
it("closes a streaming error response and aborts its fetch before returning a provider error", async () => {
  let canceled = false; let fetchSignal: AbortSignal | undefined;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {controller.enqueue(new TextEncoder().encode("Synthetic upstream failure"));},
    cancel() {canceled = true;},
  });
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {fetchSignal = init.signal as AbortSignal; return new Response(body, {status: 503});});
  const provider = new OpenAICompatibleProvider({apiKey: "test-key", baseUrl: "https://test.invalid", model: "test"});
  await expect(provider.analyze({name: "private.txt", segments: sampleResult.evidence})).rejects.toMatchObject({code: "LIVE_PROVIDER_FAILED"});
  expect(canceled).toBe(true);
  expect(fetchSignal?.aborted).toBe(true);
});
