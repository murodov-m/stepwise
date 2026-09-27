---
doc: spec
status: draft
---
# StepWise — Technical Spec

## How This Works, In Plain Language
The browser holds the current checklist. A local server reads a supplied document before asking an optional AI service to organize it. It checks the AI's references against the text it read itself. The bundled sample bypasses external services and uses a fixed fictional notice. There is no account or database.

## The Core Journey Through the System
Input → server request → independently extracted source passages → optional analyzer → result/evidence validation → browser plan → local answers and completion state. The sample follows the same result contract using bundled passages and deterministic output. Opening a source displays server-owned text in a modal. Clearing the session drops the browser's current state. PRD ref: `prd.md > The Core Journey`.

## Stack
- TypeScript, React, Next.js App Router: preserve the existing single-app architecture. [Next.js documentation](https://nextjs.org/docs).
- Zod: one runtime result contract, used before display. [Zod documentation](https://zod.dev/).
- PDF.js (`pdfjs-dist`): text extraction with page provenance and an owned, cancellable loading task. [Official repository](https://github.com/mozilla/pdf.js).
- Tesseract.js with bundled English language data: local OCR without runtime language downloads. [Official repository](https://github.com/naptha/tesseract.js).
- Vitest and Playwright: server/domain regressions and full-browser journeys. [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/).

Pinned resolved versions live in `package-lock.json`.

## Where It Runs and How Someone Tries It
Use Node.js 24 LTS and npm. Run `npm ci`, `npm run dev`, then open `http://localhost:3000`. Choose **Try the sample**. No key or paid service is needed. An optional production run uses `npm run build` then `npm start`. See [README](../README.md) for setup and verification commands.


## Look and Feel
Carry forward PRD's Action First direction using ordinary CSS: neutral `#f5f6f3`, near-black `#171b18`, green `#24623d`, Arial/system sans-serif, rounded panels, and visible focus. Stack tasks/facts on mobile. Respect reduced-motion preferences. PRD ref: `prd.md > Look and Feel`.

## Components
### Input and session controller
The client accepts a file or pasted text, calls the document endpoint, handles cancellation/errors, and owns session-wide clearing. PRD ref: `prd.md > Sample and live input`, `prd.md > States and Boundaries`.

### Server processing boundary
The document route checks body size, file type/signature, configured mode, and cancellation. Extraction has a 30-second budget; provider analysis has a separate 30-second budget. Maximum extracted text: 100,000 characters; maximum PDF pages: 40; maximum image size: 16 million pixels. Both PDF and OCR run in owned child processes so initialization and CPU-heavy work can be terminated, with process exit awaited. PDF/OCR resources close on success, failure, and timeout. PRD ref: `prd.md > Evidence and uncertainty`.

### Result validation and plan logic
The schema checks identifiers, questions, real calendar dates, and evidence states. The evidence validator requires an explicit authoritative source list. It rejects missing/duplicate/forged references and normalized empty quotes. Each offered answer needs an action mapping or supported built-in guidance with a valid target. The plan functions order unfinished actions according to actual selected answers and derive relative deadline labels. PRD ref: `prd.md > A plan that changes with the user's progress`, `prd.md > Dates and drafts`.

### Results and evidence modal
Show remaining actions, source/suggested deadlines, required documents, warnings, selected answers, and draft status. Use a native modal dialog with initial focus, inactive background, Escape dismissal, and return focus. PRD ref: `prd.md > Screens and Layout`.

## Data Model
`AnalysisResult` contains summary, findings, actions, up to three questions, drafts, warnings, and evidence segments. `SourceSegment` has server-owned ID/text and optional page. Evidence references quote a segment. Actions separate pending/completed status from linked/needs_confirmation evidence status; dates distinguish source/suggested/none. Answers map question IDs to selected option labels; option-specific mappings can affect priority. Everything lasts only for the current session/request.

## File Structure
```
app/                 # route, page, layout, styling, API
components/          # input, progress, plan, questions, evidence
lib/domain/          # schema, fixture, dates, personalization
lib/server/          # extraction, provider, validation, processing
public/sample/       # fictional notice
tests/               # unit, integration, browser checks
devpost/             # required planning, build checklist, code map
docs/                # verification, third-party notices, screenshot
```

## External Services and Dependencies
Sample mode makes no provider request. Optional live mode sends extracted segments to an OpenAI-compatible `/chat/completions` endpoint with a structured contract, not the raw file or filename. Configure `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` on the server only. Provider availability, retention, pricing, quotas, and model quality depend on the user's selected service and are not verified without credentials. No external analytics, font, or database is needed. The server requires process-spawning support; full-install Node `next start` is verified, while standalone/serverless deployment is not.

## Important Failure Modes
- Unreadable/unsupported document → clear message, replace input or use the sample.
- Timeout, unavailable provider, or invalid result → recoverable error; never substitute a sample result for the uploaded document.
- OCR transcription errors → visible OCR warning and confirmation state; compare against the original image.

## What Was Simplified and Why
- Fixed fictional sample gives a repeatable no-key demo; live quality needs separate provider evaluation.
- Temporary state avoids storing sensitive documents; history would need a separate privacy/storage design.
- Plain text, text-bearing PDFs, and direct images prove extraction; multipage scanned PDF OCR and other languages are deferred.
- Reject a PDF if any page has no readable text, even a legitimate blank page, to avoid silently omitting a scanned requirement.

## Decisions and Open Issues
Product decisions are recorded in `prd.md > Product Decisions`. Real-provider quality and hosted operation need separate evaluation; neither is established by the deterministic sample.

## Document Provenance
Generated using the official Learn Skill Pack `4-spec` template. This document describes the current implementation; [verification](../docs/verification.md) records the checked behavior and limitations.
