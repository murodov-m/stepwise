---
doc: checklist
status: draft
---
# Build Checklist

Build mode: fast. Technical milestones are complete; learner checkpoints remain separate.

## Slices

- [x] **1. A document becomes a plan with source evidence.**
  Sample mode needs no key. Optional live input uses independent extraction, validates quotes and answer effects, and bounds processing time and resources.
  References: `prd.md > Sample and live input`, `prd.md > Evidence and uncertainty`; `spec.md > Server processing boundary`, `spec.md > Result validation and plan logic`.

- [x] **2. The person can personalize, finish, and clear the plan.**
  Selected answers affect ordering or guidance. Completion advances the next task. Source passages, requirements, warnings, reset and recovery are accessible on desktop and mobile.
  References: `prd.md > The Core Journey`, `prd.md > A plan that changes with the user's progress`; `spec.md > Input and session controller`, `spec.md > Results and evidence modal`.

- [x] **3. A judge can install and inspect the project.**
  Public MIT-licensed source includes sample-first setup, required planning documents, a code map, testing evidence and dependency notices. Fresh-install checks pass on Windows and hosted Ubuntu.
  References: [README](../README.md), [verification](../docs/verification.md), [third-party notices](../docs/third-party-notices.md).

## Hands-on Checkpoints

- [ ] Early usable behavior explored by the learner.
- [ ] Final hands-on exploration and feedback completed by the learner.

## Final Review

- [x] Independent technical review approved; 72 unit tests, 12 browser tests, lint, typecheck and production build passed on 27 September 2026.
- [ ] Learner confirms readiness to ship.

## Code Tour and App Map

- [x] [Code map](app-map.html) generated, source links checked, and layout inspected.
- [ ] Learning activity completed by the learner.
- [ ] Optional edit and transfer reflection addressed.

Reference route: `StepWiseApp.submit` → `POST/processSample/validateAnalysisResult` → `ActionPlan/prioritizeActions`. The map is available as a reference; learner activity and reflection have not been recorded.

## Revisions

- Source quotes are checked against independently extracted passages.
- PDF and OCR extraction use owned child processes for bounded cleanup. PDFs with any unreadable or blank page are refused to avoid silently omitting a requirement.
- Type checking generates Next route definitions first. The lockfile preserves exact dependency versions for fresh installation.

Generated with the official Devpost Learn Skill Pack `5-build` checklist structure.
