---
doc: prd
status: draft
---
# StepWise — Product Requirements

Help a person responding to an administrative notice organize a short plan and check its source. Source: `scope.md > Who It's For` and `scope.md > The Unique Kernel`.

## The Core Journey
1. Arrive at the single-page app; see sample and document-input choices plus the privacy boundary.
2. Try the fictional sample without a key, or deliberately choose optional live input.
3. Wait for processing; cancel or recover from an actionable error if necessary.
4. Read the count of remaining tasks and the first unfinished action, including its deadline and required documents.
5. Open evidence for a task or fact, read all cited passages, then return to the plan.
6. Answer up to three questions. Selected answers remain visible and influence the next action or readiness guidance.
7. Complete or reopen tasks; copy a labeled draft if useful.
8. Clear the session to return to a clean input screen.

Source: `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.

## Screens and Layout
The input view, processing view, and results view share one route. Results put the next action above numbered tasks and key facts, with questions and drafts below. Evidence opens in a modal side panel. At small widths the plan and facts form one column. No separate account or dashboard screen.

## Look and Feel
Compact, high contrast, neutral background, green accent, readable sans-serif type, visible keyboard focus, restrained motion. Interface copy names what the user can do and explains uncertainty without claiming professional authority. Source: `scope.md > Inspiration & Identity`.

## Features and Behavior
### Sample and live input
Sample mode is explicitly deterministic and requires no external service. Live mode supports plain text/pasted text, text-bearing PDF, PNG, JPEG, and WebP. Maximum upload: 8 MiB. Unsupported, oversized, unreadable, encrypted, or image-only PDFs produce a recovery message. A rejected file can be replaced.

### A plan that changes with the user's progress
The next-action panel derives from the ordered incomplete actions. Completing it exposes the next one; completing everything shows a completed state. Priority choices preserve the selected option and can move different actions first. Readiness and address answers produce distinct guidance. Incoming completed state is respected. Source: `scope.md > The Unique Kernel`.

### Evidence and uncertainty
Facts and actions show either linked evidence or a confirmation warning. All supporting references are accessible. Show page numbers only when extraction supplied them. Display required documents and all warnings. Image OCR carries an explicit transcription warning. A source link shows provenance; it does not prove the analyzer understood the passage correctly.

### Dates and drafts
Calendar dates must be valid. Deterministic relative/overdue labels update against today's date. Suggested scheduling dates are distinguishable from dates stated in the document. Draft messages are labeled and copied only on the user's action; clipboard errors remain recoverable.

## States and Boundaries
- **First use:** no document selected; sample available immediately.
- **Processing:** honest activity status, cancel control, bounded extraction and analysis.
- **Failure:** no fabricated fallback; retry, replace input, or choose the sample.
- **Results:** in-memory answers, action completion, and source context.
- **Cleared:** result, original input, answers, and progress dropped together.
- **Privacy:** no database or app document logging; live extracted text goes to the configured external analyzer, whose retention policy applies.
- **Advice:** informational organization only; original issuer and qualified professionals remain the authority.

## Product Decisions
- Keep the no-key sample as the main demonstration; live mode is optional.
- Focus on administrative paperwork, an Action First layout, and temporary sessions without accounts or persistent storage.
- Validate references against independently extracted server-owned text.

## What We're Building
The complete journey above, regression coverage, installable public source, an open-source license, official Skill Pack planning artifacts, and a code map.

## Deferred From the POC
Saved history, accounts, automated official responses, multilingual OCR, and scanned multipage PDF processing. Each expands storage, authority, or extraction responsibilities beyond this proof of concept.

## Possible Later Enhancements
User testing can reveal which document categories and languages deserve dedicated extraction and evaluation. A hosted version would need its own access, retention, rate-limit, and operations design.

## Non-Goals
Determine eligibility, guarantee accuracy, deliver professional advice, or silently invent absent document details. Source: `scope.md > Explicitly Cut`.

## Open Questions
Real-provider quality needs separate evaluation with a configured service. The no-key sample and controlled provider tests establish the current proof-of-concept boundary.

## Document Provenance
Generated with the official Learn Skill Pack `3-prd` template from `scope.md` and the existing project design.
