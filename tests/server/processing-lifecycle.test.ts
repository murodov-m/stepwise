import { afterEach, expect, it, vi } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { processLiveDocument } from "@/lib/server/process-document";
import { OpenAICompatibleProvider } from "@/lib/server/live-provider";
import { POST } from "@/app/api/analyze/route";
import { validateAnalysisResult } from "@/lib/server/evidence";
afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers();});
const document = {name: "SECRET-FILENAME.txt", mimeType: "text/plain", bytes: new TextEncoder().encode(sampleResult.evidence[0].text)};

it("bounds extraction and never invokes a provider after extraction timeout", async () => {
  vi.useFakeTimers(); let calls = 0; let aborted: AbortSignal | undefined;
  const promise = processLiveDocument(document, {analyze: async () => {calls++; return sampleResult;}}, async (_document, signal) => {aborted = signal; return new Promise(() => {});});
  const rejection = expect(promise).rejects.toMatchObject({code: "ANALYSIS_TIMEOUT"});
  await vi.advanceTimersByTimeAsync(30001); await rejection;
  expect(calls).toBe(0); expect(aborted?.aborted).toBe(true);
});
it("keeps OCR-linked claims explicitly unconfirmed", async () => {
  const result = await processLiveDocument(document, {analyze: async () => sampleResult}, async () => ({segments: sampleResult.evidence, warnings: ["Confirm OCR"], requiresConfirmation: true}));
  expect(result.actions.every(action => action.evidenceStatus === "needs_confirmation")).toBe(true);
  expect(result.findings.every(finding => finding.status === "needs_confirmation")).toBe(true);
  expect(result.actions[0].evidence).toEqual(sampleResult.actions[0].evidence);
});
it("replaces provider-owned labels and pages with trusted source metadata", () => {
  const result = structuredClone(sampleResult); result.evidence[0].label = "forged"; result.evidence[0].page = 99;
  expect(validateAnalysisResult(result, sampleResult.evidence).evidence).toEqual(sampleResult.evidence);
});
it.each(["actions", "findings", "questions", "drafts"] as const)("rejects duplicate %s IDs", (key) => {
  const result = structuredClone(sampleResult); result[key].push(result[key][0] as never);
  expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow();
});
it("rejects mapping to an unoffered option or unknown action", () => {
  const result = structuredClone(sampleResult); result.questions[0].optionActions = {secret: "missing-action"};
  expect(() => validateAnalysisResult(result, sampleResult.evidence)).toThrow();
});
it.each(["not json", "{}", '{"choices":[{"message":{"content":"not json"}}]}'])("safely rejects malformed provider content", async (body) => {
  vi.stubGlobal("fetch", async () => new Response(body));
  await expect(new OpenAICompatibleProvider({apiKey: "SECRET-KEY", baseUrl: "https://test.invalid", model: "test"}).analyze({name: "secret", segments: sampleResult.evidence})).rejects.toMatchObject({code: "LIVE_PROVIDER_FAILED"});
});
it("returns a safe invalid-analysis error for forged provider evidence", async () => {
  vi.stubEnv("AI_API_KEY", "SECRET-KEY"); vi.stubEnv("AI_MODEL", "test");
  vi.stubGlobal("fetch", async () => Response.json({choices: [{message: {content: JSON.stringify(sampleResult)}}]}));
  const form = new FormData(); form.set("mode", "live"); form.set("file", new File(["PRIVATE UNRELATED TEXT"], "SECRET-FILENAME.txt", {type: "text/plain"}));
  const response = await POST(new Request("http://localhost/api/analyze", {method: "POST", body: form}));
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({code: "ANALYSIS_INVALID", message: "The analysis could not be verified. Try again or use the sample."});
});
it("bounds an undeclared streaming body while reading", async () => {
  let pulls = 0;
  const stream = new ReadableStream({pull(controller) {pulls++; controller.enqueue(new Uint8Array(1024*1024)); if(pulls === 15) controller.close();}});
  const request = new Request("http://localhost/api/analyze", {method: "POST", body: stream, duplex: "half", headers: {"content-type": "multipart/form-data; boundary=abc"}} as RequestInit);
  const response = await POST(request);
  expect(response.status).toBe(413); expect(pulls).toBeLessThan(15);
});
it("returns a safe timeout response when the upstream fetch never completes", async () => {
  vi.useFakeTimers(); vi.stubEnv("AI_API_KEY", "SECRET-KEY"); vi.stubEnv("AI_MODEL", "test");
  let started!: () => void; const providerStarted = new Promise<void>(resolve => {started = resolve;});
  vi.stubGlobal("fetch", async () => {started(); return new Promise(() => {});});
  const form = new FormData(); form.set("mode", "live"); form.set("file", new File(["A synthetic readable notice."], "SECRET-FILENAME.txt", {type: "text/plain"}));
  const pending = POST(new Request("http://localhost/api/analyze", {method: "POST", body: form}));
  await providerStarted;
  await vi.advanceTimersByTimeAsync(30001);
  const response = await pending;
  expect(response.status).toBe(504);
  const body = await response.json();
  expect(body.code).toBe("ANALYSIS_TIMEOUT");
  expect(Object.keys(body).sort()).toEqual(["code", "message"]);
  expect(JSON.stringify(body)).not.toMatch(/SECRET-KEY|SECRET-FILENAME|synthetic readable/);
});
it("aborts extraction on request cancellation and never starts the provider", async () => {
  const controller = new AbortController(); let extractionSignal: AbortSignal | undefined; let providerCalls = 0;
  let started!: () => void; const extractionStarted = new Promise<void>(resolve => {started = resolve;});
  let finish!: (value: {segments: typeof sampleResult.evidence; warnings: string[]; requiresConfirmation: boolean}) => void;
  const extraction = new Promise<{segments: typeof sampleResult.evidence; warnings: string[]; requiresConfirmation: boolean}>(resolve => {finish = resolve;});
  const pending = processLiveDocument(document, {analyze: async () => {providerCalls++; return sampleResult;}}, async (_document, signal) => {extractionSignal = signal; started(); return extraction;}, controller.signal);
  const outcome = pending.then(() => "resolved", error => error.code);
  await extractionStarted; controller.abort();
  const abortedAtCancellation = extractionSignal?.aborted;
  // Even a late extractor result cannot revive a canceled analysis.
  finish({segments: sampleResult.evidence, warnings: [], requiresConfirmation: false});
  expect(await outcome).toBe("ANALYSIS_TIMEOUT");
  expect(abortedAtCancellation).toBe(true);
  expect(providerCalls).toBe(0);
});
it("aborts provider analysis on request cancellation and ignores its late response", async () => {
  const controller = new AbortController(); let providerSignal: AbortSignal | undefined;
  let started!: () => void; const providerStarted = new Promise<void>(resolve => {started = resolve;});
  let finish!: (result: typeof sampleResult) => void;
  const analysis = new Promise<typeof sampleResult>(resolve => {finish = resolve;});
  const pending = processLiveDocument(document, {analyze: async (_document, signal) => {providerSignal = signal; started(); return analysis;}}, async () => ({segments: sampleResult.evidence, warnings: [], requiresConfirmation: false}), controller.signal);
  const outcome = pending.then(() => "resolved", error => error.code);
  await providerStarted; controller.abort();
  const abortedAtCancellation = providerSignal?.aborted;
  finish(sampleResult);
  expect(await outcome).toBe("ANALYSIS_TIMEOUT");
  expect(abortedAtCancellation).toBe(true);
});
it("propagates the route request signal to the provider after upload completes", async () => {
  vi.stubEnv("AI_API_KEY", "test-key"); vi.stubEnv("AI_MODEL", "test");
  const controller = new AbortController(); let fetchSignal: AbortSignal | undefined;
  let started!: () => void; const providerStarted = new Promise<void>(resolve => {started = resolve;});
  let finish!: (response: Response) => void;
  const upstream = new Promise<Response>(resolve => {finish = resolve;});
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {fetchSignal = init.signal as AbortSignal; started(); return upstream;});
  const form = new FormData(); form.set("mode", "live"); form.set("file", new File([sampleResult.evidence[0].text], "private.txt", {type: "text/plain"}));
  const pending = POST(new Request("http://localhost/api/analyze", {method: "POST", body: form, signal: controller.signal}));
  await providerStarted; controller.abort();
  const abortedAtCancellation = fetchSignal?.aborted;
  finish(Response.json({choices: [{message: {content: JSON.stringify(sampleResult)}}]}));
  const response = await pending;
  expect(response.status).toBe(504);
  expect(abortedAtCancellation).toBe(true);
});
