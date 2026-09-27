---
doc: checklist
status: draft
---
# Build Checklist

Build mode: fast — continuing the existing project under the learner's instruction to finish; independent verification remains required.

## Slices

- [x] **1. A document can become a plan whose evidence belongs to the document**
  Becomes usable: The existing sample works without a key; optional live requests extract trustworthy source segments and reject fabricated references.
  Why now: The reviewed source-ownership defect undermines the project's central promise.
  PRD ref: `prd.md > Sample and live input`, `prd.md > Evidence and uncertainty`
  Spec ref: `spec.md > Stack`, `spec.md > Server processing boundary`, `spec.md > Result validation and plan logic`
  Build: Preserve the scaffold, add bounded local extraction and provider contract, separate completion/evidence/date states, repair answer-dependent prioritization, and add regressions.
  Verify (mechanical): Red-before-green source/priority regressions, actual text/PDF/image extraction, safe server errors and limits; lint, typecheck, unit/integration tests, production build.
  Mechanical evidence: Independent spec and quality review approved; 63 tests, lint, typecheck, build, and production sample/text/PDF/OCR checks passed. Learner exploration remains separately pending below.
  Learner check: Try the sample and inspect the deadline's passage; later compare a configured live result with its original document.
  Commit: `Complete trusted document processing` (parent coordinates the reviewed initial publication commit).

- [x] **2. The person can personalize, finish, and clear the plan**
  Becomes usable: Selected answers change the plan, all evidence and required documents are accessible, completion advances the next action, and a new session starts cleanly.
  Why now: This completes the visible core loop on the trustworthy result contract.
  PRD ref: `prd.md > The Core Journey`, `prd.md > A plan that changes with the user's progress`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Input and session controller`, `spec.md > Results and evidence modal`
  Build: Dynamic next action/count, visible uncertainty/documents/answers, accessible native modal, replacement/reset/pasted input/cancel, recoverable clipboard errors, responsive and reduced-motion layout.
  Verify (mechanical): Browser regressions for actual order, readiness, completion, full reset, evidence keyboard focus, invalid input recovery, cancellation, mobile width, and reduced motion; all quality gates.
  Mechanical evidence: Independent spec and quality review approved; 11 browser tests and 63 unit/server tests, lint, typecheck and build passed. Parent observed production sample, actual prioritization, keyboard source modality and 375px layout. Learner hands-on checks remain separate.
  Learner check: Select Gathering documents, check what changes, complete a task, open/close its source with the keyboard, then start a new document.
  Commit: `Complete the temporary checklist journey` (parent coordinates publication).

- [ ] **3. A judge can install and inspect the complete project**
  Becomes usable: Public licensed source with accurate setup/privacy/limitations documentation and a real demo recording prepared for the learner's YouTube upload.
  Why now: Submission assets must reflect the finished app and verified behavior.
  PRD ref: `prd.md > What We're Building`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > File Structure`
  Build: README, license, notices, factual handoff, app map, demo footage and upload mechanics; audit the publication set and create the requested GitHub repository.
  Verify (mechanical): Clean install and full checks, final independent review, no ignored personal/secrets files in publication, video duration/actual-functioning footage and source links.
  Learner check: Follow README setup, review the working app, upload the video publicly, and write the required Devpost fields in your own words.
  Commit: `Prepare StepWise for public judging`.

## Hands-on Checkpoints
- [ ] Early usable behavior explored — learner feedback has not yet been reported.
- [ ] Final kick-the-tires exploration and feedback completed.

## Final Review
- [x] Final independent technical review and required checks pass.
- [ ] Final review complete — feedback resolved and learner confirms ready to ship.

## Code Tour and App Map
- [ ] Learning activity complete — guided route or brief recap offered after implementation.
- [ ] Optional edit and transfer reflection addressed.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown.

Activity and evidence: `devpost/app-map.html` is generated from the finished implementation as a static reference. Its 22 local links and 24 anchors were checked, and its layout and native details were inspected in a browser. No learner exercise or mastery is claimed.
Route and stops: Reference-only route: `components/stepwise-app.tsx > StepWiseApp/submit` → `app/api/analyze/route.ts > POST` plus `processSample/validateAnalysisResult` → `components/action-plan.tsx > ActionPlan/toggleComplete` plus `prioritizeActions`. This route has not been completed as a learner activity.
Edit outcome: Not tried.
Reflection: Not yet offered; personal answers belong only in the ignored profile.
Activity mode: Reference-only route prepared; learner activity and reflection remain unperformed.

## Revisions
- Clean-install verification found eight inherited lock entries missing registry download/integrity metadata. Filled only those fields for the unchanged versions. Standalone type checking now generates Next route definitions first: plain TypeScript previously passed an intentionally invalid temporary route on an absent-`.next` copy. Generated `next-env.d.ts` is ignored per the installed Next guide; the probe is not product source.
- PDF.js replaced the initially proposed wrapper because an owned loading task is needed for cleanup; both extractors use owned child processes after Windows native teardown and nested OCR lifetime checks showed that a thread-only host was insufficient.
- PDFs with any unreadable/blank page are conservatively refused to avoid silently omitting a scanned requirement. This limitation is explicit in setup documentation.
