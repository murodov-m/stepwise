# StepWise Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the existing StepWise proof of concept and produce an accurate submission package.
**Architecture:** Preserve the Next.js application; introduce an authoritative extraction boundary before analysis, strengthen domain semantics, then complete the existing client and shipping assets.
**Tech Stack:** Existing Next.js/React/TypeScript/Zod/Vitest/Playwright/CSS; PDF.js (`pdfjs-dist`) for page-preserving text extraction and `tesseract.js` with bundled English language data for local image OCR. Pin installed dependency versions in the lockfile. Initial investigation replaced pdf-parse because the wrapper did not expose cancellable loading-task ownership.
**Spec:** `docs/superpowers/specs/2026-09-26-stepwise-completion-design.md`, correcting `2026-09-24-stepwise-design.md` according to the user-approved review.

## Global Constraints

- The no-key sample is the authoritative demonstration; live mode remains optional.
- No accounts, persistent document storage, database, analytics, or automatic form submission.
- Keep credentials server-side; never log uploaded documents or extracted text.
- Preserve the minimal, high-contrast Action First direction and keyboard/mobile/reduced-motion support.
- Maximum upload: 8 MiB; maximum extracted text: 100,000 characters; maximum PDF: 40 pages; extraction/provider timeout: 30 seconds each.
- Every important finding/action has valid authoritative evidence or explicit confirmation status.
- Implementers do not commit or publish. The parent coordinates the user's authorized new public `murodov-m/stepwise` repository, including its necessary initial project commit/push after verification; do not merge into unrelated branches or accept legal rules for the user.
- Use TDD for behavior changes. Every implementer reads the relevant installed Next.js docs before modifying routes/config/client code.

## Review Focus

- Provider returns fixture or invented source for an unrelated upload: reject instead of displaying a verified result.
- Whitespace-only quotes, duplicate IDs, impossible dates, or missing question/action links: reject safely.
- User chooses different answers, finishes the next action, or starts another document: reflect actual state and clear the old session.
- OCR/PDF/provider failure or indefinite request: terminate resources and present a bounded recovery path without private content in errors.
- Keyboard-only and 375px-wide use: all controls and evidence remain reachable; modal focus is contained and restored.

### Task 1: Trustworthy processing and domain contract

**Files:** Modify `lib/domain/schema.ts`, `sample-fixture.ts`, `personalize.ts`, `lib/server/evidence.ts`, `sample-processor.ts`, `live-provider.ts`, `process-document.ts`, `errors.ts`, `app/api/analyze/route.ts`, `package.json`, lockfile, `next.config.ts`; create focused `lib/server/extract-document.ts`, `lib/domain/deadlines.ts` and tests in `tests/domain/` and `tests/server/`.

**Interfaces:**
- `UploadedDocument = { name: string; mimeType: string; bytes: Uint8Array }`.
- `ExtractedDocument = { segments: SourceSegment[]; warnings: string[]; requiresConfirmation: boolean }`.
- `DocumentExtractor = (document: UploadedDocument, signal?: AbortSignal) => Promise<ExtractedDocument>`; exported `extractDocument` default implementation.
- `ProviderDocument = { name: string; segments: SourceSegment[] }`; `LiveProvider.analyze(document: ProviderDocument, signal?: AbortSignal): Promise<unknown>`.
- `processLiveDocument(document, provider, extractor?: DocumentExtractor, requestSignal?: AbortSignal): Promise<AnalysisResult>`; injected extractor is only the natural processing boundary for deterministic tests. Optional fourth signal preserves existing calls while propagating request cancellation to both stages.
- `validateAnalysisResult(input: unknown, authoritativeSources: SourceSegment[]): AnalysisResult`; explicit sources required. Sample passes its trusted source fixture.
- `Action` keeps `status: pending | completed`, adds `evidenceStatus: linked | needs_confirmation` and `dueKind: source | suggested | none`; preserve schema defaults for old fixture compatibility where needed.
- `Question` retains option labels and adds option-dependent effects via `optionActions: Record<string,string>`; keep `affectsActionId` optional for migration. Valid references only.
- `QuestionAnswers = Record<string,string>`; `prioritizeActions(actions, questionsOrPriority?, answers?)` preserves old string-priority calls and supports question answers. `getActionDueLabel(action, today?: string)` derives source/suggested/overdue text; no timezone-shifted ISO dates.

- [x] **Step 1: Add regression tests and run them RED.** Existing `processLiveDocument` must reject an unrelated uploaded text paired with sample provider output; whitespace quote, duplicate source ID, and `2026-99-99` must fail validation. Write tests for answer-dependent mapping and date boundaries before implementing those behaviors. Log expected failures.
- [x] **Step 2: Implement extraction, schema, and authoritative validation.** Read installed library docs. Use page-level PDF text and local English OCR with bundled `@tesseract.js-data/eng` language data so runtime needs no language download. Configure only required server external packages. Refuse empty/corrupt/encrypted/image-only PDF content and poor OCR with actionable typed errors; mark accepted OCR results as requiring confirmation. Always close PDF/OCR resources; no disk uploads or language cache writes. Enforce limits and bounds. Add real text/PDF/image extraction tests (synthetic fixtures only).
- [x] **Step 3: Implement the provider and route boundary.** Provider sends server-owned text segments and full schema/contract; bounded fetch with injected abort signal; parse safely. Do not trust returned evidence text; verify it against authoritative segments. Safe route responses distinguish upload, extraction, invalid-analysis, provider, and timeout states, contain only safe code/message fields, and never echo text, filename, or secret. No-key live errors offer sample. Bound multipart request size before/while buffering where practicable; validate payload/type signatures, not MIME alone. Add adapter request-contract, server invalid/oversized/blank upload, privacy, forged-source, and timeout tests.
- [x] **Step 4: Implement deadline and answer semantics.** Explicit option-to-action mapping for priorities; readiness/address responses produce meaningful state without changing the evidence. Suggested deadlines stay labeled, impossible dates fail, and overdue dates render relative to injected calendar date. Ensure no unjustified third required document or fixed arbitrary suggested date survives in the sample.
- [x] **Step 5: Verify and self-review.** Focused tests GREEN, then full `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`. Record exact outcomes, dependency versions, boundaries, TDD evidence, and exported interfaces in the report. No commit. Parent obtains independent task review before Task 2.

### Task 2: Complete the coherent client experience

**Files:** Modify `components/stepwise-app.tsx`, `action-plan.tsx`, `clarification-questions.tsx`, `evidence-drawer.tsx`, `processing-view.tsx`, `error-state.tsx`, `app/globals.css`, `tests/e2e/stepwise.spec.ts`, `playwright.config.ts`; create focused presentation helpers/components only where responsibility calls for them.

**Interfaces:** Consume Task 1's `AnalysisResult`, per-question answer mapping, evidence and deadline helpers. Result receives `onNewDocument()` from parent. Clarification callback transmits `(questionId: string, option: string)`; selected state is accessible. Parent owns cancellation and complete session clearing.

- [x] **Step 1: Write meaningful browser regressions and observe RED.** Assert that Gathering documents becomes the first action and Meeting the deadline selects its own action. Assert required document names and confirmation badges; completing first action updates Start here; all-complete state; reset returns to upload and drops previous answers. Test all source quotes, dialog initial focus/Tab containment/Escape/restoration, invalid-upload replacement, pasted input, and client timeout/cancel recovery. Use API interception only for unavailable provider/timeout or different result shape, not to fake the primary sample flow.
- [x] **Step 2: Align browser/server hostname configuration.** Use localhost consistently and avoid reuse of an unrelated server; ensure runner teardown is bounded. Preserve real sample route tests. Correct the earlier assertion that checked only already-visible text.
- [x] **Step 3: Implement results and questions.** Dynamic count and next incomplete applicable action; render documents, all refs, source/suggested deadlines, uncertainty, and drafts. Honor completion supplied by result. Store answers per question and label selection. Never invent a page number. Add clear source-linkage and informational boundaries, sample label, and OCR warnings. Clipboard failure has visible recovery.
- [x] **Step 4: Implement input/session/recovery.** Sample first; file and pasted text input with client checks, privacy explanation before live submission, cancelable bounded request, invalid-file replacement, new-document path, full reset with no old File/result/text retained. Progress may describe processing phases but must not assert timer-inferred phase completion. Keep provider credentials and internals out of UI.
- [x] **Step 5: Implement modal and responsive accessibility.** Native modal dialog with initial focus, inactive background, Escape/backdrop dismissal, and trigger restoration; visible focus and keyboard controls; 375px width and reduced motion. Add checks for overflow and control reachability.
- [x] **Step 6: Verify and self-review.** `npm run e2e`, full unit tests, typecheck, lint, build. Report results/TDD evidence and limitations, no commit; parent gets independent task review.

### Task 3: Skill Pack artifacts and submission package

**Files:** Generate `devpost/learner-profile.md`, `scope.md`, `prd.md`, `spec.md`, `checklist.md`, `app-map.html`; add `README.md`, `LICENSE`, `docs/submission/rules-checklist.md`, `submission-facts.md`, `demo-runbook.md`, `youtube-upload.md`, `third-party-notices.md`; update `.env.example`, `.gitignore`, `.github/workflows/ci.yml` where useful; add demo recording and screenshots under `docs/submission/` or deliverable output.

**Interfaces:** Runnable sample-first installation, documented optional live mode and extraction limits. Generated planning artifacts must trace to the actual Skill Pack workflows, agreed scope/design, and verified implementation. No invented personal biography, participant claims, public URL, live-provider test, or awards.

- [ ] **Step 1: Install and read the official Skill Pack.** Execute `npx skills add challengepost/learn-ai-basics --all -y`, read installed skills and their templates, and follow `1-start`, `2-scope`, `3-prd`, `4-spec`, `5-build`, `6-ship` against already-approved decisions. Defer only learner-authored biography/reflections/submission answers actually required by those instructions; ask focused questions while independent work continues. Do not fabricate participant statements.
- [ ] **Step 2: Produce truthful shipping docs.** README uses `npm ci`, sample-first run, exact quality gates, optional provider configuration, local extraction/OCR limits, in-memory handling, provider retention disclosure, informational limits, and judging platform. MIT license year 2026, StepWise contributors. Pin supported Node runtime. Ignore credentials/caches/traces; preserve original planning provenance and disclose dependencies/synthetic sample. Write rules mapping within a concise factual summary linking the official page.
- [ ] **Step 3: Prepare an actual demonstration.** Record functioning sample, priority changes, requirements/uncertainty, evidence, completion/reset, and the visible no-key label. Under 180 seconds, target 130–150. Use only synthetic content and licensed/self-created assets; no copyrighted music. Provide screenshot(s), exact duration, playable video, and YouTube public upload instructions. Learner supplies any narration/public submission copy per official Skill Pack; factual technical inventory and camera timing are allowed. No account publication without user-authorized authenticated destination.
- [ ] **Step 4: Final verification and review.** Fresh lint, typecheck, unit/integration suite, build, browser suite, clean `npm ci` in a separate temporary copy, manual desktop/mobile/keyboard checks, and independent whole-project review. Fix real blocking findings through TDD and repeat affected gates. Package source and submission assets without secrets or generated dependency/build directories. Record final checks in `devpost/checklist.md`.
- [ ] **Step 5: Public repository and handoff.** Parent creates user-authorized public `murodov-m/stepwise` after GitHub authentication, commits and pushes the verified project as necessary for that request, verifies repository content/license visibility and install instructions, then inserts actual URLs. User uploads prepared video to YouTube and enters their own reflections and final Devpost submission/rule acceptance. If any external action remains impossible, state the precise outstanding requirement and keep useful work complete; never label incomplete external assets as submitted.
