"use client";

import { useEffect, useRef, useState } from "react";
import { analysisResultSchema, type AnalysisResult } from "@/lib/domain/schema";
import { ActionPlan } from "@/components/action-plan";
import { ErrorState } from "@/components/error-state";
import { ProcessingView } from "@/components/processing-view";

type AppState = "idle" | "processing" | "success" | "error";
type RequestMode = "sample" | "live";
type AnalysisRequest = { mode: RequestMode; file?: File };
type RequestError = { code: string; message: string };

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
// Allows the server's upload, extraction, and analysis bounds (30s each), plus transit.
const REQUEST_TIMEOUT_MS = 100_000;
const ALLOWED_FILE_TYPES = new Set(["text/plain", "application/pdf", "image/jpeg", "image/png", "image/webp"]);

function validateLiveFile(file?: File): RequestError | null {
  if (!file?.size) return { code: "UPLOAD_INVALID", message: "Choose a nonempty document to analyze." };
  if (file.size > MAX_FILE_SIZE) return { code: "UPLOAD_INVALID", message: "The document must be no larger than 8 MB." };
  if (!ALLOWED_FILE_TYPES.has(file.type)) return { code: "UPLOAD_INVALID", message: "Use a PDF, JPG, PNG, WebP, or plain-text document." };
  return null;
}

export function StepWiseApp() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultMode, setResultMode] = useState<RequestMode>("sample");
  const [error, setError] = useState<RequestError | null>(null);
  const [lastRequest, setLastRequest] = useState<AnalysisRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const generation = useRef(0);
  const active = useRef<{ controller: AbortController; timer: number } | null>(null);

  function stopRequest() {
    generation.current++;
    if (active.current) {
      window.clearTimeout(active.current.timer);
      active.current.controller.abort();
      active.current = null;
    }
  }

  useEffect(() => () => {
    generation.current++;
    if (active.current) {
      window.clearTimeout(active.current.timer);
      active.current.controller.abort();
    }
  }, []);

  function resetSession() {
    stopRequest();
    setResult(null);
    setError(null);
    setLastRequest(null);
    setFile(null);
    setText("");
    setResultMode("sample");
    setState("idle");
  }

  function rejectInput(validationError: RequestError) {
    stopRequest();
    setLastRequest(null);
    setFile(null);
    setText("");
    setError(validationError);
    setState("error");
  }

  async function submit(request: AnalysisRequest) {
    stopRequest();
    const validationError = request.mode === "live" ? validateLiveFile(request.file) : null;
    if (validationError) return rejectInput(validationError);
    const requestGeneration = generation.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (generation.current !== requestGeneration) return;
      stopRequest();
      setError({ code: "CLIENT_TIMEOUT", message: "The request took too long. Try again, choose another document, or use the sample." });
      setState("error");
    }, REQUEST_TIMEOUT_MS);
    active.current = { controller, timer };
    setLastRequest(request);
    if (request.mode === "sample") { setFile(null); setText(""); }
    setResult(null);
    setError(null);
    setState("processing");
    const form = new FormData();
    form.set("mode", request.mode);
    if (request.file) form.set("file", request.file);
    try {
      const response = await fetch("/api/analyze", { method: "POST", body: form, signal: controller.signal });
      const body: unknown = await response.json();
      if (generation.current !== requestGeneration) return;
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : "The request could not be completed. Try again or use the sample.";
        setError({ code: "REQUEST_FAILED", message });
        setState("error");
        return;
      }
      const parsed = analysisResultSchema.safeParse(body);
      if (!parsed.success) throw new Error("Invalid result");
      setResult(parsed.data);
      setResultMode(request.mode);
      setLastRequest(null);
      setFile(null);
      setText("");
      setState("success");
    } catch {
      if (generation.current !== requestGeneration) return;
      setError({ code: "REQUEST_FAILED", message: "The request could not be completed. Check your connection, try again, or use the sample." });
      setState("error");
    } finally {
      window.clearTimeout(timer);
      if (generation.current === requestGeneration) active.current = null;
    }
  }

  function submitText() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) return rejectInput({ code: "UPLOAD_INVALID", message: "Paste nonempty document text, up to 100,000 characters." });
    void submit({ mode: "live", file: new File([trimmed], "pasted-document.txt", { type: "text/plain" }) });
  }

  if (state === "processing") return <ProcessingView onCancel={resetSession} />;
  if (state === "error") return <ErrorState message={error?.message ?? "Something went wrong."} onRetry={lastRequest ? () => void submit(lastRequest) : undefined} onReplace={resetSession} onSample={() => void submit({ mode: "sample" })} />;
  if (state === "success" && result) return <ActionPlan result={result} mode={resultMode} onNewDocument={resetSession} />;

  return (
    <main className="shell">
      <header className="topbar"><span className="wordmark">STEPWISE /</span><span className="private-label">Temporary session</span></header>
      <section className="hero">
        <p className="eyebrow">Administrative paperwork, made actionable</p>
        <h1>Know what to do next.</h1>
        <p className="lede">Turn a confusing notice into a short, evidence-linked plan.</p>
        <button className="button primary" onClick={() => void submit({ mode: "sample" })}>Try the sample</button>
        <p className="microcopy">A fixed example notice. No account or live analysis service needed.</p>
      </section>
      <section className="input-panel" aria-labelledby="live-title">
        <p className="eyebrow">Optional live analysis</p><h2 id="live-title">Use your own document</h2>
        <p id="privacy-explanation">Files are processed temporarily on this server. Only extracted text is sent to the configured analysis service. Retention by that provider follows its own policy. Avoid uploading sensitive details you do not want to share.</p>
        <p className="microcopy">StepWise does not save or log your document. File and text selections stay in this page until you clear them, finish analysis, or leave. No forms are submitted to an issuing office.</p>
        <div className="hero-actions">
          <label className="button secondary" htmlFor="document-upload">Choose a document<input id="document-upload" type="file" accept="text/plain,application/pdf,image/jpeg,image/png,image/webp" aria-describedby="privacy-explanation upload-help" onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = "";
            if (!chosen) return;
            const invalid = validateLiveFile(chosen);
            if (invalid) return rejectInput(invalid);
            setFile(chosen);
            setText("");
          }} /></label>
          {file && <button className="button primary" onClick={() => void submit({ mode: "live", file })}>Analyze document</button>}
        </div>
        {file && <p className="selected-file">Selected: {file.name}</p>}
        <p className="microcopy" id="upload-help">Up to 8 MB: plain text, readable PDF (up to 40 pages), PNG, JPG, or WebP. English image transcription can contain errors.</p>
        <label className="input-label" htmlFor="document-text">Paste document text</label>
        <textarea id="document-text" rows={6} value={text} aria-describedby="privacy-explanation text-help" onChange={event => { setText(event.target.value); setFile(null); }} />
        <p className="microcopy" id="text-help">Up to 100,000 characters. Check the text against your original notice.</p>
        <div className="hero-actions"><button className="button secondary" onClick={submitText}>Analyze pasted text</button><button className="text-button" onClick={resetSession}>Clear selections</button></div>
      </section>
      <p className="microcopy boundary">An informational planning aid. It does not provide legal, financial, or eligibility advice. Confirm important details with the issuing office.</p>
    </main>
  );
}
