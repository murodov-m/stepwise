# StepWise completion design

This is a corrective continuation of the approved StepWise design and the 26 September review, authorized by the user's request to finish the project. Preserve the administrative-paperwork scope, Action First visual direction, no-key deterministic sample, and optional live analysis. The user selected a new public GitHub repository under `murodov-m`, the sample as the primary demo, and a recording plus YouTube upload instructions.

## Intended outcome

A judge can install the project, open the bundled sample without credentials, understand the next action and deadline, inspect every supporting source passage, answer up to three questions that actually change the plan, complete actions, and clear the session. The optional live path must never validate model-invented source passages. Submission assets must describe demonstrated behavior accurately.

## Processing boundary

- Uploaded files are at most 8 MiB. Plain text, text-bearing PDF, PNG, JPEG, and WebP are accepted; pasted text is supported through the same plain-text path. No document persistence or logging.
- Extract source segments independently before calling the analyzer. Plain text is decoded and trimmed. PDF text extraction preserves page numbers and refuses encrypted, unreadable, excessively long, or image-only PDFs with an actionable error. Images use local English OCR and carry an explicit transcription warning. OCR text is evidence for what was transcribed, never proof that transcription is accurate.
- Use server-owned source IDs and source text. The analyzer receives those segments and the actual result contract. Returned source bodies never establish authority; reject missing, duplicated, forged, or inconsistent references. Replace display evidence with server-owned segments after validation.
- Bound extraction to 30 seconds and provider analysis to 30 seconds; terminate OCR/PDF resources in all outcomes. Bound extracted text to 100,000 characters and PDFs to 40 pages. No silent substitution of sample output on live failure.
- Reject blank normalized quotes, duplicate entity IDs, invalid question/action mappings, and impossible dates. Important facts/actions either link to source or carry an explicit confirmation status. Source linkage establishes provenance, not semantic or professional correctness.
- Action completion status and evidence status are separate. Model-suggested dates are labeled suggestions; calendar-valid dates and overdue/relative labels are calculated deterministically. Original-source deadlines remain distinguishable from suggested scheduling.
- Keep provider credentials on the server. Do not send raw files to the optional analysis provider; send extracted source segments. Document provider retention as governed by the configured provider, without promising deletion from its systems.

## Personalization and results

- Store selected answers by question ID; every option preserves its own answer and optional prioritized action ID. Priority options can choose different actions. Readiness/address questions must distinguish yes, no, partly, and uncertain responses.
- Derive the action count and Start here panel from applicable incomplete actions. When all actions are complete, show that state. Required documents, uncertainty, all evidence references, drafts, and completion state are visible.
- Use a native modal evidence dialog with initial focus, inactive background, Escape dismissal, and return focus. Show segment-only context when page information is absent.
- Permit replacement of a rejected file and starting a new document from results. Clearing a session drops result, answers, original file/text, and progress. Requests have cancellation/timeout recovery; progress labels must not claim completed verification based only on a timer.
- Visible copy explains informational/non-advice limits, temporary local session state, optional third-party processing, and deterministic sample mode. Maintain responsive layout, visible focus, and reduced-motion compatibility.

## Shipping

Use the official Devpost Learn Skill Pack workflow against these approved decisions and the original design; generate its planning artifacts without inventing learner biography or personal reflection. Include README, MIT license, provider/setup/privacy/limitations documentation, tests, a source-code map, accurate English submission notes, a demo recording under three minutes, and upload instructions.

Official rules were read on 26 September 2026: https://learn-ai-basics.devpost.com/rules. Required public repository, English materials, working end-to-end proof of concept, Skill Pack planning docs, public YouTube/Vimeo video under three minutes, and free judging access are tracked in the submission checklist. Deadline: 26 October 2026 at 17:00 EDT (27 October at 02:00 in Tashkent). Entrant eligibility and final rule acceptance remain personal actions; do not attest them for the user.

## Verification

Regression tests must reproduce the source-forgery and personalization defects before fixes. Test server limits, unreadable input, extraction/provider failure, timeout, privacy-safe errors, calendar boundaries, required documents, uncertainty labels, complete/reset/new-document flow, evidence keyboard behavior, and narrow-screen rendering. Run lint, typecheck, unit/integration tests, build, browser tests, clean-install verification, and independent code review before claiming readiness.
