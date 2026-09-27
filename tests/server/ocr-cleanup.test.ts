import { afterEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { syntheticPdf } from "./extraction-fixtures";
const lifecycle = vi.hoisted(() => ({hosts: [] as {terminate: ReturnType<typeof vi.fn>; emit: (event: string, value: unknown) => void}[], started: undefined as (() => void) | undefined}));
vi.mock("node:child_process", () => ({spawn: () => {
  const listeners = new Map<string, ((value: unknown) => void)[]>();
  const terminate = vi.fn(async () => 0);
  const host = {
    terminate, exitCode: null as number | null, signalCode: null,
    once(event: string, listener: (value: unknown) => void) {listeners.set(event, [...(listeners.get(event) ?? []), listener]); return host;},
    emit(event: string, value: unknown) {for(const listener of listeners.get(event) ?? []) listener(value);},
    send() {},
    kill() {void terminate(); host.exitCode = 0; host.emit("exit", 0); return true;},
  };
  lifecycle.hosts.push(host); lifecycle.started?.(); return host;
}}));
import { extractDocument } from "@/lib/server/extract-document";
afterEach(() => {lifecycle.hosts.length = 0; lifecycle.started = undefined;});

it("owns a terminable OCR process before language initialization can finish", async () => {
  const bytes = await readFile(new URL("../fixtures/ocr-notice.png", import.meta.url));
  const start = new Promise<void>(resolve => {lifecycle.started = resolve;});
  const controller = new AbortController();
  const pending = extractDocument({name: "private.png", mimeType: "image/png", bytes}, controller.signal);
  const rejection = expect(pending).rejects.toMatchObject({code: "ANALYSIS_TIMEOUT"});
  await start; controller.abort(); await rejection;
  expect(lifecycle.hosts).toHaveLength(1);
  expect(lifecycle.hosts[0].terminate).toHaveBeenCalled();
});
it("terminates its OCR process when initialization reports a failure", async () => {
  const bytes = await readFile(new URL("../fixtures/ocr-notice.png", import.meta.url));
  const start = new Promise<void>(resolve => {lifecycle.started = resolve;});
  const pending = extractDocument({name: "private.png", mimeType: "image/png", bytes});
  const rejection = expect(pending).rejects.toMatchObject({code: "EXTRACTION_FAILED"});
  await start;
  expect(lifecycle.hosts).toHaveLength(1);
  lifecycle.hosts[0].emit("error", new Error("synthetic init failure"));
  await rejection;
  expect(lifecycle.hosts[0].terminate).toHaveBeenCalled();
});
it("owns a terminable PDF process before parser initialization can finish", async () => {
  const start = new Promise<void>(resolve => {lifecycle.started = resolve;});
  const controller = new AbortController();
  const pending = extractDocument({name: "private.pdf", mimeType: "application/pdf", bytes: syntheticPdf(["Synthetic notice"])}, controller.signal);
  const rejection = expect(pending).rejects.toMatchObject({code: "ANALYSIS_TIMEOUT"});
  await start; controller.abort(); await rejection;
  expect(lifecycle.hosts).toHaveLength(1);
  expect(lifecycle.hosts[0].terminate).toHaveBeenCalled();
});
