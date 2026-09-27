# StepWise Design Specification

**Date:** 2026-09-24  
**Status:** Draft for user review  
**Project:** StepWise  
**Hackathon:** Build With AI: Basics

## 1. Product Summary

StepWise is a web application that turns unfamiliar administrative paperwork into a clear, personalized action plan. A user supplies a PDF, image, or pasted text and receives a short summary, evidence-linked facts, deadlines, required documents, uncertainty flags, and a prioritized checklist.

The first supported document category is general administrative paperwork, including government, benefits, licensing, and service notices. StepWise is an assistant for understanding and organizing a document, not a replacement for professional legal, financial, medical, or benefits advice.

The proof of concept uses a bundled sample document and deterministic fixture output so judges can test the complete flow without supplying credentials. The fixture is the authoritative no-key demo path; an optional live extraction and analysis path may be enabled when hosted services are configured, but it must use the same result contract and evidence rules as sample mode.

## 2. Goals and Non-Goals

### Goals

1. Demonstrate a complete document-to-action transformation in one short flow.
2. Make every important result traceable to a source passage or explicitly marked as needing confirmation.
3. Reduce the time required for a first-time user to understand what a document requires them to do.
4. Provide a polished, accessible, low-friction experience that works in a three-minute demonstration.
5. Use the Devpost Learn Skill Pack and include its generated planning documents in the eventual repository.

### Non-goals

The proof of concept will not include accounts, user profiles, persistent document storage, a general-purpose knowledge base, automatic form submission, legal or financial recommendations, or comprehensive coverage of every document type and jurisdiction.

## 3. Primary User Flow

1. The user lands on a single-page StepWise interface and chooses **Try the sample** or supplies a document.
2. The client validates the input and displays four processing stages: **Read → Extract → Verify → Plan**.
3. The server extracts text while preserving page and segment identifiers.
4. The analyzer returns a schema-validated result containing a summary, findings, actions, questions, optional draft messages, warnings, and evidence references.
5. The results view opens with a **Start here** panel containing the most important immediate action.
6. The user sees numbered actions with due dates, required documents, status, and a reason for each action.
7. Selecting a result opens an evidence drawer showing the relevant source text, page or segment reference, and any confidence or confirmation warning.
8. StepWise asks no more than three contextual questions to personalize priorities, missing information, or deadlines.
9. The user can mark actions complete, reset the session, and optionally copy a plainly labeled draft message.

The canonical demo uses a benefits-renewal notice. The document contains a renewal deadline, eligibility information, required documents, and an unclear contact detail so the transformation demonstrates extraction, prioritization, evidence, and uncertainty handling.

## 4. Architecture

The proof of concept is one Node-compatible, deployable web application with a client interface and a server-side processing boundary. It does not require a separate database or vector store.

### Client responsibilities

- Accept the bundled sample, PDF, image, or pasted text.
- Validate basic file type and size before upload.
- Display processing progress and recoverable error states.
- Render the action plan, clarification questions, and evidence drawer.
- Hold only temporary in-memory session state.

### Server responsibilities

- Re-validate uploads and enforce size and type limits.
- Delete temporary uploads after processing.
- Invoke the text-extraction adapter and preserve source references.
- Invoke the analysis adapter with a structured-output contract.
- Validate the response and reject malformed or unsupported claims.
- Build the final plan from validated fields.
- Keep provider credentials server-side and avoid logging document contents or personal data.

### Processing modules

- **Document input:** normalizes the selected source into a processing request.
- **Text extractor:** returns ordered text segments with stable source identifiers.
- **Structured analyzer:** returns facts, actions, questions, drafts, warnings, and evidence references.
- **Evidence validator:** verifies that important claims have a valid source reference or an explicit `needs_confirmation` status.
- **Plan builder:** converts validated analysis fields into the display model and calculates relative deadlines.
- **Results workspace:** renders the plan and evidence without allowing unsupported output to enter the UI.

The extraction and analysis providers sit behind small adapter interfaces. The proof of concept uses one hosted provider selected during implementation planning to satisfy the free-tier-first constraint, or the bundled fixture when no provider is configured. The provider choice must preserve the same interfaces, schema, and sample-mode contract.

## 5. Result Contract

The analysis result contains these top-level fields:

- `summary`: a concise plain-language description of what the document concerns.
- `findings`: important facts with labels, values, status, and evidence references.
- `actions`: ordered tasks with title, reason, due date or relative deadline, status, and required-document fields.
- `questions`: at most three short questions used to personalize the plan.
- `drafts`: optional draft messages, clearly labeled as drafts and never presented as official instructions.
- `warnings`: extraction uncertainty, missing information, and limitations.
- `evidence`: source segments referenced by the other fields.

Each important finding or action must contain either a valid evidence reference or `needs_confirmation`. Confidence values guide the interface but never replace the evidence check. A failed validation is an error state, not a partially trusted result.

## 6. Interface and Visual Direction

The approved direction is **Action First**:

- Minimal, compact, and high contrast.
- Neutral surfaces with near-black text and one green accent.
- A prominent **Start here** summary rather than a generic chatbot conversation.
- Numbered action cards with deadlines and required documents.
- A private-session indicator and short privacy explanation.
- Evidence in a drawer or panel so source context does not overwhelm the main workflow.
- No purple AI gradients, decorative sparkles, or chatbot bubbles.

The interface must be responsive, keyboard accessible, readable at small widths, and compatible with reduced-motion preferences. Processing states must explain what is happening without exposing internal secrets or overly technical implementation details.

## 7. Safety, Privacy, and Failure Handling

- StepWise labels outputs as informational and directs users to the original authority or qualified professional for decisions.
- The app does not infer legal eligibility, financial consequences, or medical conclusions.
- Missing or unreadable content is shown as missing or uncertain, never silently completed.
- Unsupported file types, oversized files, extraction failures, malformed model output, and provider outages receive distinct, actionable states.
- Live mode never silently substitutes a fabricated result when a provider fails. It offers retry or the bundled sample.
- Temporary files are deleted after processing. Request logs exclude document contents, extracted text, and personal data.
- The proof of concept has no accounts, persistent storage, third-party analytics, or form submission.

## 8. Testing Strategy

### Unit tests

- Validate the result schema and reject missing or malformed evidence.
- Verify relative deadline calculations and overdue labels.
- Verify checklist ordering and missing-information handling.
- Verify question limits and draft labeling.

### Integration tests

- Process the bundled sample through extraction, analysis, validation, and plan construction.
- Reject unsupported file types and oversized files.
- Simulate low-quality extraction and provider failure.
- Confirm that temporary source material is removed after processing.

### End-to-end and manual checks

- Run sample upload → processing → result plan → evidence drawer.
- Run a malformed upload and verify the recovery path.
- Verify keyboard navigation, focus behavior, responsive layout, and reduced-motion behavior.
- Record a complete demonstration under three minutes with a public video and public repository.

## 9. Success Criteria

The proof of concept succeeds when a judge can:

1. Open the sample without an API key or account.
2. Follow one uninterrupted flow from document to prioritized action plan.
3. Identify the most important next action and its deadline.
4. Open evidence for a central claim and see the source passage.
5. Observe an explicit uncertainty state instead of an invented answer.
6. Understand the privacy and non-advice boundaries.
7. Install and run the project using the repository instructions.

The event submission will additionally include a public repository with a detectable open-source license, a short English description, and a public YouTube or Vimeo demonstration under three minutes.

## 10. Delivery Constraints

- The project is newly created during the hackathon submission period.
- Git and Node.js are installed in the project environment.
- The Devpost Learn Skill Pack is installed with `npx skills add challengepost/learn-ai-basics --all -y`.
- The repository includes the Skill Pack-generated `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md` planning documents.
- The project runs consistently on its intended platform and is available for judging without payment.
- All third-party APIs, SDKs, data, and assets are used only with appropriate authorization and are disclosed in the repository.

## 11. Approved Decisions

- Solo-focused proof of concept.
- StepWise as the product concept.
- Administrative paperwork as the first document category.
- Hybrid action-first transformation with a small clarification step.
- Minimal Action First visual direction.
- Free-tier-first infrastructure and deterministic sample mode.
- No accounts, database, vector store, persistent document storage, or automated form submission in the MVP.
