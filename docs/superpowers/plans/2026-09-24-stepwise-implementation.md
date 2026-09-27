# StepWise Implementation Plan

> **Historical plan, superseded:** The corrective implementation and shipping work follows [the 26 September completion plan](2026-09-26-stepwise-completion.md). This document preserves the original proposal and its assumptions; unchecked steps here are not the current completion state. See [the build checklist](../../../devpost/checklist.md) and submission verification record for current evidence.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, evidence-linked administrative-paperwork assistant that turns a bundled sample document into a personalized action plan without credentials.

**Architecture:** Use a single Next.js App Router application with a client-side state machine and a Node route handler. Keep document processing behind extraction/analysis adapters, validate every important result against source evidence, and use a deterministic fixture for the primary no-key demo path.

**Tech Stack:** Next.js App Router, TypeScript, React, Zod, Vitest, Playwright, ESLint, plain CSS, and an optional OpenAI-compatible HTTP provider.

## Global Constraints

- The project is newly created during the hackathon submission period.
- Git and Node.js are available in the project environment.
- Install the Devpost Learn Skill Pack with `npx skills add challengepost/learn-ai-basics --all -y`.
- The repository must include `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md`.
- The no-key sample path is the authoritative demo path and must work without an API key.
- Every important finding or action has either a valid source evidence reference or `needs_confirmation`.
- Do not add accounts, persistent document storage, a database, a vector store, third-party analytics, or automatic form submission.
- Keep provider credentials server-side, never log document contents, and delete temporary uploaded bytes after processing.
- Use the minimal high-contrast Action First visual direction; do not add purple AI gradients, decorative sparkles, or chatbot bubbles.
- Keep the interface keyboard accessible, responsive, and compatible with reduced-motion preferences.
- Use red-green-refactor TDD for behavior changes and run the repository lint, typecheck, test, build, and end-to-end commands before claiming completion.
- Do not create commits automatically; pause at each checkpoint and commit only when explicitly requested.

---

## File Map

- `app/layout.tsx`: document metadata, language, and root layout.
- `app/page.tsx`: thin server entry point that renders the client application.
- `app/globals.css`: reset, type scale, color tokens, responsive layout, focus states, and reduced-motion rules.
- `app/api/analyze/route.ts`: request parsing, upload limits, sample/live dispatch, and safe error responses.
- `components/stepwise-app.tsx`: client state machine for idle, processing, success, and error states.
- `components/processing-view.tsx`: four-stage progress presentation.
- `components/action-plan.tsx`: start-here summary and numbered action cards.
- `components/evidence-drawer.tsx`: source quote and page/segment context for a selected claim.
- `components/clarification-questions.tsx`: up-to-three optional personalization questions.
- `components/error-state.tsx`: actionable upload and provider errors.
- `lib/domain/schema.ts`: Zod schemas and inferred TypeScript types for the result contract.
- `lib/domain/sample-fixture.ts`: synthetic source document and deterministic expected result.
- `lib/domain/personalize.ts`: pure action prioritization based on an answer.
- `lib/server/errors.ts`: typed application errors and safe error codes.
- `lib/server/evidence.ts`: schema and source-reference validation.
- `lib/server/sample-processor.ts`: no-key sample processing entry point.
- `lib/server/live-provider.ts`: optional OpenAI-compatible provider adapter.
- `lib/server/process-document.ts`: live document normalization, provider invocation, and validation.
- `tests/domain/schema.test.ts`: contract and fixture tests.
- `tests/server/evidence.test.ts`: evidence-integrity tests.
- `tests/server/personalize.test.ts`: personalization tests.
- `tests/server/process-document.test.ts`: provider and upload-boundary tests.
- `tests/e2e/stepwise.spec.ts`: browser-level sample flow and evidence interaction.
- `playwright.config.ts`: local Next.js web server and browser test configuration.
- `vitest.config.ts`: Node test environment and path alias.
- `.env.example`: names for optional live-provider configuration without secrets.
- `.gitignore`: dependency, build, test, environment, and visual-companion exclusions.
- `README.md`: setup, sample demo, live-mode configuration, privacy boundaries, and deployment notes.
- `LICENSE`: detectable open-source license required by the event rules.
- `public/sample/benefits-renewal-notice.txt`: synthetic document used by the demo.
- `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, `devpost/checklist.md`: Skill Pack planning and shipping state.

## Interfaces

- `AnalysisResult` is the validated display model consumed by the API and client.
- `processSample(sampleId: "benefits-renewal"): AnalysisResult` returns the no-key result.
- `validateAnalysisResult(input: unknown): AnalysisResult` parses the schema and verifies every evidence quote against the declared source segment.
- `processLiveDocument(document: UploadedDocument, provider: LiveProvider): Promise<AnalysisResult>` normalizes a user file, calls the provider, and validates the response.
- `UploadedDocument` accepts a sample or a file; the client sends `mode=sample` or `mode=live` as `FormData`.
- `prioritizeActions(actions: Action[], answer?: string): Action[]` returns actions ordered for the selected user priority without changing the underlying evidence.
- `ActionPlan`, `EvidenceDrawer`, and `ClarificationQuestions` receive `AnalysisResult` or focused slices of it and emit user actions only.

---

### Task 1: Bootstrap the application and quality gates

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `eslint.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `components/stepwise-app.tsx`
- Create: `app/globals.css`
- Create: `.env.example`
- Create: `.gitignore`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- `npm run dev` starts the Next.js development server.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run e2e` are available from the project root.

- [ ] **Step 1: Install the declared dependencies and persist the lockfile**

Run:

```bash
npm init -y
npm install next react react-dom zod
npm install --save-dev typescript @types/node @types/react @types/react-dom vitest @vitejs/plugin-react eslint eslint-config-next @playwright/test
```

Set the package scripts and module type in `package.json`:

```json
{
  "name": "stepwise",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Configure TypeScript, Next.js, Vitest, Playwright, and ESLint**

Create `tsconfig.json` with the Next.js App Router defaults and the `@/*` alias:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "playwright-report/**", "coverage/**"]),
]);
```

- [ ] **Step 3: Add the minimal app shell and environment documentation**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StepWise",
  description: "Turn administrative paperwork into a clear action plan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
import { StepWiseApp } from "@/components/stepwise-app";

export default function HomePage() {
  return <StepWiseApp />;
}
```

Create `components/stepwise-app.tsx`:

```tsx
export function StepWiseApp() {
  return (
    <main className="shell">
      <p className="eyebrow">StepWise</p>
      <h1>Know what to do next.</h1>
    </main>
  );
}
```

Create `app/globals.css`:

```css
:root {
  --surface: #f5f6f3;
  --panel: #ffffff;
  --ink: #171b18;
  --muted: #5f6962;
  --line: #d9dfda;
  --accent: #24623d;
  --accent-soft: #e0efe4;
  --warning: #8a5a00;
}

* { box-sizing: border-box; }
html { background: var(--surface); }
body { margin: 0; color: var(--ink); background: var(--surface); font-family: Arial, sans-serif; }
button, input, textarea { font: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 3px solid #8bbd9a; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
```

Create `.env.example`:

```text
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=
```

Create `.gitignore`:

```text
node_modules/
.next/
out/
coverage/
playwright-report/
.env
.env*.local
.superpowers/
```

- [ ] **Step 4: Write and run the first smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs TypeScript tests", () => {
    expect(true).toBe(true);
  });
});
```

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: the smoke test passes, all four commands exit with status 0, and `git diff --check` produces no output.

- [ ] **Step 5: Review checkpoint**

Run `git status --short` and inspect the generated configuration. Do not commit automatically; continue after the checkpoint.

---

### Task 2: Define the result contract and deterministic sample

**Files:**
- Create: `lib/domain/schema.ts`
- Create: `lib/domain/sample-fixture.ts`
- Create: `public/sample/benefits-renewal-notice.txt`
- Test: `tests/domain/schema.test.ts`

**Interfaces:**
- `analysisResultSchema.parse(value: unknown): AnalysisResult`
- `sampleSourceText: string`
- `sampleResult: AnalysisResult`
- `SourceSegment`, `EvidenceRef`, `Finding`, `Action`, `Question`, and `Draft` are inferred from Zod.

- [ ] **Step 1: Write the failing contract and fixture tests**

Create `tests/domain/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { analysisResultSchema } from "@/lib/domain/schema";
import { sampleResult } from "@/lib/domain/sample-fixture";

describe("analysis result contract", () => {
  it("accepts the deterministic sample", () => {
    expect(analysisResultSchema.parse(sampleResult)).toEqual(sampleResult);
  });

  it("rejects more than three clarification questions", () => {
    const result = {
      ...sampleResult,
      questions: [...sampleResult.questions, ...sampleResult.questions, ...sampleResult.questions, ...sampleResult.questions],
    };
    expect(() => analysisResultSchema.parse(result)).toThrow();
  });
});
```

Run `npm run test -- tests/domain/schema.test.ts` and confirm the test fails because the schema and fixture do not exist.

- [ ] **Step 2: Implement the Zod contract**

Create `lib/domain/schema.ts`:

```ts
import { z } from "zod";

export const sourceSegmentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  page: z.number().int().positive().optional(),
  text: z.string().min(1),
});

export const evidenceRefSchema = z.object({
  sourceId: z.string().min(1),
  quote: z.string().min(1),
});

const claimStatusSchema = z.enum(["linked", "needs_confirmation"]);

export const findingSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  status: claimStatusSchema,
  evidence: z.array(evidenceRefSchema),
});

export const actionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueLabel: z.string().min(1),
  status: z.enum(["pending", "completed"]),
  requiredDocuments: z.array(z.string()),
  evidence: z.array(evidenceRefSchema),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  affectsActionId: z.string().min(1),
});

export const draftSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  evidence: z.array(evidenceRefSchema),
});

export const analysisResultSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(findingSchema),
  actions: z.array(actionSchema).min(1),
  questions: z.array(questionSchema).max(3),
  drafts: z.array(draftSchema),
  warnings: z.array(z.string()),
  evidence: z.array(sourceSegmentSchema).min(1),
});

export type SourceSegment = z.infer<typeof sourceSegmentSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
```

- [ ] **Step 3: Add the synthetic sample document and result**

Create `public/sample/benefits-renewal-notice.txt`:

```text
COMMUNITY BENEFITS RENEWAL NOTICE

Reference: SAMPLE-2026-014

Your annual review must be completed by October 18, 2026. Please review the information below and contact the office if anything is incorrect.

Documents required
1. Proof of income dated within the last 60 days.
2. A current photo identification document.

If your address changed, use the contact information on page 2. The phone number is not visible in this copy.
```

Create `lib/domain/sample-fixture.ts`:

```ts
import type { AnalysisResult } from "@/lib/domain/schema";

export const sampleSourceText = `COMMUNITY BENEFITS RENEWAL NOTICE

Reference: SAMPLE-2026-014

Your annual review must be completed by October 18, 2026. Please review the information below and contact the office if anything is incorrect.

Documents required
1. Proof of income dated within the last 60 days.
2. A current photo identification document.

If your address changed, use the contact information on page 2. The phone number is not visible in this copy.`;

export const sampleResult: AnalysisResult = {
  summary: "This notice asks you to complete an annual benefits review by October 18, 2026 and provide two supporting documents.",
  findings: [
    {
      id: "deadline",
      label: "Renewal deadline",
      value: "October 18, 2026",
      status: "linked",
      evidence: [{ sourceId: "source-1", quote: "Your annual review must be completed by October 18, 2026." }],
    },
    {
      id: "documents",
      label: "Required documents",
      value: "Proof of income and current photo identification",
      status: "linked",
      evidence: [{ sourceId: "source-1", quote: "1. Proof of income dated within the last 60 days." }, { sourceId: "source-1", quote: "2. A current photo identification document." }],
    },
    {
      id: "phone",
      label: "Contact phone",
      value: "Not visible in this copy",
      status: "needs_confirmation",
      evidence: [{ sourceId: "source-1", quote: "The phone number is not visible in this copy." }],
    },
  ],
  actions: [
    {
      id: "check-details",
      title: "Check your details",
      reason: "The notice says to contact the office if information is incorrect.",
      dueDate: "2026-09-29",
      dueLabel: "Suggested: do this first",
      status: "pending",
      requiredDocuments: [],
      evidence: [{ sourceId: "source-1", quote: "Please review the information below and contact the office if anything is incorrect." }],
    },
    {
      id: "gather-documents",
      title: "Gather the two required documents",
      reason: "The notice lists proof of income and photo identification.",
      dueDate: "2026-10-11",
      dueLabel: "Suggested: about one week before the deadline",
      status: "pending",
      requiredDocuments: ["Proof of income", "Current photo identification"],
      evidence: [{ sourceId: "source-1", quote: "1. Proof of income dated within the last 60 days." }, { sourceId: "source-1", quote: "2. A current photo identification document." }],
    },
    {
      id: "submit-review",
      title: "Review the renewal before submitting",
      reason: "The annual review must be completed by the stated deadline.",
      dueDate: "2026-10-18",
      dueLabel: "Due October 18, 2026",
      status: "pending",
      requiredDocuments: ["Completed annual review"],
      evidence: [{ sourceId: "source-1", quote: "Your annual review must be completed by October 18, 2026." }],
    },
  ],
  questions: [
    { id: "priority", prompt: "What should StepWise prioritize first?", options: ["Understanding the notice", "Gathering documents", "Meeting the deadline"], affectsActionId: "check-details" },
    { id: "address", prompt: "Did your address change?", options: ["No", "Yes", "Not sure"], affectsActionId: "check-details" },
    { id: "documents-ready", prompt: "Are the two required documents ready?", options: ["Yes", "No", "Partly"], affectsActionId: "gather-documents" },
  ],
  drafts: [
    {
      id: "contact-draft",
      title: "Draft message to the benefits office",
      body: "Hello, I am reviewing reference SAMPLE-2026-014. I would like to confirm that the information in my notice is correct and ask which documents you need for my renewal.",
      evidence: [{ sourceId: "source-1", quote: "Please review the information below and contact the office if anything is incorrect." }],
    },
  ],
  warnings: ["Confirm the deadline and requirements with the issuing office before submitting."],
  evidence: [
    { id: "source-1", label: "Renewal notice", page: 1, text: sampleSourceText },
  ],
};
```

- [ ] **Step 4: Run the focused and full checks**

Run:

```bash
npm run test -- tests/domain/schema.test.ts
npm run typecheck
npm run lint
```

Expected: the contract tests pass and both static checks exit with status 0.

- [ ] **Step 5: Review checkpoint**

Run `git diff --check` and inspect the schema, sample text, and fixture together. Do not commit automatically.

---

### Task 3: Validate evidence and personalize the action plan

**Files:**
- Create: `lib/server/errors.ts`
- Create: `lib/server/evidence.ts`
- Create: `lib/server/sample-processor.ts`
- Create: `lib/domain/personalize.ts`
- Test: `tests/server/evidence.test.ts`
- Test: `tests/server/personalize.test.ts`
- Test: `tests/server/sample-processor.test.ts`

**Interfaces:**
- `validateAnalysisResult(input: unknown): AnalysisResult`
- `processSample(sampleId: "benefits-renewal"): AnalysisResult`
- `prioritizeActions(actions: Action[], answer?: string): Action[]`
- `AnalysisValidationError` has a safe `code` and `message`.

- [ ] **Step 1: Write failing evidence and personalization tests**

Create `tests/server/evidence.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { AnalysisValidationError, validateAnalysisResult } from "@/lib/server/evidence";

describe("analysis evidence", () => {
  it("accepts a result whose quotes exist in its source", () => {
    expect(validateAnalysisResult(sampleResult)).toEqual(sampleResult);
  });

  it("rejects a quote that is not in the declared source", () => {
    const result = structuredClone(sampleResult);
    result.findings[0].evidence[0].quote = "This text does not exist";
    expect(() => validateAnalysisResult(result)).toThrow(AnalysisValidationError);
  });

  it("rejects a reference to an unknown source", () => {
    const result = structuredClone(sampleResult);
    result.actions[0].evidence[0].sourceId = "missing-source";
    expect(() => validateAnalysisResult(result)).toThrow(AnalysisValidationError);
  });
});
```

Create `tests/server/personalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { prioritizeActions } from "@/lib/domain/personalize";

describe("action prioritization", () => {
  it("keeps document order when no priority is selected", () => {
    expect(prioritizeActions(sampleResult.actions).map((action) => action.id)).toEqual(["check-details", "gather-documents", "submit-review"]);
  });

  it("moves the action linked to the selected priority first", () => {
    expect(prioritizeActions(sampleResult.actions, "gather-documents").map((action) => action.id)).toEqual(["gather-documents", "check-details", "submit-review"]);
  });
});
```

Create `tests/server/sample-processor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { processSample } from "@/lib/server/sample-processor";

describe("sample processor", () => {
  it("returns a validated benefits-renewal plan", () => {
    expect(processSample("benefits-renewal").evidence[0].id).toBe("source-1");
  });
});
```

Run the focused tests and confirm they fail because the modules do not exist.

- [ ] **Step 2: Implement typed errors and evidence validation**

Create `lib/server/errors.ts`:

```ts
export class AnalysisValidationError extends Error {
  readonly code = "ANALYSIS_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "AnalysisValidationError";
  }
}

export class UploadValidationError extends Error {
  readonly code = "UPLOAD_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export class LiveProviderError extends Error {
  readonly code = "LIVE_PROVIDER_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "LiveProviderError";
  }
}
```

Create `lib/server/evidence.ts`:

```ts
import { analysisResultSchema, type AnalysisResult, type EvidenceRef } from "@/lib/domain/schema";
import { AnalysisValidationError } from "@/lib/server/errors";

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function assertEvidence(evidence: EvidenceRef[], sources: Map<string, string>): void {
  for (const reference of evidence) {
    const source = sources.get(reference.sourceId);
    if (!source) {
      throw new AnalysisValidationError(`Unknown evidence source: ${reference.sourceId}`);
    }
    if (!normalized(source).includes(normalized(reference.quote))) {
      throw new AnalysisValidationError("An evidence quote is not present in its source segment");
    }
  }
}

export function validateAnalysisResult(input: unknown): AnalysisResult {
  let result: AnalysisResult;
  try {
    result = analysisResultSchema.parse(input);
  } catch {
    throw new AnalysisValidationError("The analysis response does not match the StepWise contract");
  }
  const sources = new Map(result.evidence.map((segment) => [segment.id, segment.text]));

  for (const finding of result.findings) {
    if (finding.status === "linked" && finding.evidence.length === 0) {
      throw new AnalysisValidationError(`Finding ${finding.id} needs evidence`);
    }
    assertEvidence(finding.evidence, sources);
  }

  for (const action of result.actions) {
    if (action.evidence.length === 0) {
      throw new AnalysisValidationError(`Action ${action.id} needs evidence`);
    }
    assertEvidence(action.evidence, sources);
  }

  for (const draft of result.drafts) {
    assertEvidence(draft.evidence, sources);
  }

  return result;
}
```

Create `lib/server/sample-processor.ts`:

```ts
import { sampleResult } from "@/lib/domain/sample-fixture";
import type { AnalysisResult } from "@/lib/domain/schema";
import { validateAnalysisResult } from "@/lib/server/evidence";

export function processSample(sampleId: "benefits-renewal"): AnalysisResult {
  if (sampleId !== "benefits-renewal") {
    throw new Error(`Unknown sample: ${sampleId}`);
  }
  return validateAnalysisResult(sampleResult);
}
```

- [ ] **Step 3: Implement safe action prioritization**

Create `lib/domain/personalize.ts`:

```ts
import type { Action } from "@/lib/domain/schema";

export function prioritizeActions(actions: Action[], answer?: string): Action[] {
  if (!answer) {
    return [...actions];
  }

  const index = actions.findIndex((action) => action.id === answer);
  if (index < 0) {
    return [...actions];
  }

  return [actions[index], ...actions.slice(0, index), ...actions.slice(index + 1)];
}
```

- [ ] **Step 4: Run the red-green verification cycle**

Run:

```bash
npm run test -- tests/server/evidence.test.ts tests/server/personalize.test.ts tests/server/sample-processor.test.ts
npm run typecheck
npm run lint
```

Expected: the new tests pass, including rejection of unknown sources and unsupported quotes. Do not commit automatically.

---

### Task 4: Add the optional live provider and safe API boundary

**Files:**
- Create: `lib/server/live-provider.ts`
- Create: `lib/server/process-document.ts`
- Create: `app/api/analyze/route.ts`
- Test: `tests/server/process-document.test.ts`
- Test: `tests/server/api-route.test.ts`

**Interfaces:**
- `LiveProvider.analyze(document: ProviderDocument): Promise<unknown>`
- `createLiveProviderFromEnv(env: NodeJS.ProcessEnv): LiveProvider | null`
- `processLiveDocument(document: UploadedDocument, provider: LiveProvider): Promise<AnalysisResult>`
- `POST /api/analyze` accepts `FormData` with `mode=sample` or `mode=live` and an optional `file`.

- [ ] **Step 1: Write failing provider and route tests**

Create `tests/server/process-document.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sampleResult } from "@/lib/domain/sample-fixture";
import { LiveProviderError } from "@/lib/server/errors";
import { processLiveDocument } from "@/lib/server/process-document";

const document = {
  name: "notice.txt",
  mimeType: "text/plain",
  bytes: new TextEncoder().encode(sampleResult.evidence[0].text),
};

describe("live document processing", () => {
  it("validates a provider result before returning it", async () => {
    const result = await processLiveDocument(document, { analyze: async () => sampleResult });
    expect(result.summary).toContain("annual benefits review");
  });

  it("rejects a provider response with missing evidence", async () => {
    const invalid = structuredClone(sampleResult);
    invalid.actions[0].evidence = [];
    await expect(processLiveDocument(document, { analyze: async () => invalid })).rejects.toThrow();
  });

  it("turns provider errors into a typed error", async () => {
    await expect(processLiveDocument(document, { analyze: async () => { throw new Error("upstream unavailable"); } })).rejects.toBeInstanceOf(LiveProviderError);
  });
});
```

Create `tests/server/api-route.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { sampleResult } from "@/lib/domain/sample-fixture";

beforeEach(() => {
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_MODEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("analyze route", () => {
  it("returns the sample without a provider key", async () => {
    const form = new FormData();
    form.set("mode", "sample");
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    expect(response.status).toBe(200);
    expect((await response.json()).summary).toBe(sampleResult.summary);
  });

  it("returns a safe configuration error for live mode without a key", async () => {
    const form = new FormData();
    form.set("mode", "live");
    form.set("file", new File(["notice"], "notice.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("LIVE_MODE_UNAVAILABLE");
  });
});
```

- [ ] **Step 2: Implement the OpenAI-compatible adapter**

Create `lib/server/live-provider.ts`:

```ts
import { LiveProviderError } from "@/lib/server/errors";

export interface ProviderDocument {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface LiveProvider {
  analyze(document: ProviderDocument): Promise<unknown>;
}

export interface LiveProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function documentPart(document: ProviderDocument) {
  if (document.mimeType === "text/plain") {
    return { type: "text", text: new TextDecoder().decode(document.bytes) };
  }

  const data = `data:${document.mimeType};base64,${Buffer.from(document.bytes).toString("base64")}`;
  if (document.mimeType.startsWith("image/")) {
    return { type: "image_url", image_url: { url: data } };
  }
  return { type: "file", file: { filename: document.name, file_data: data } };
}

export class OpenAICompatibleProvider implements LiveProvider {
  constructor(private readonly config: LiveProviderConfig) {}

  async analyze(document: ProviderDocument): Promise<unknown> {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Extract and organize the document. Return only valid JSON. Every finding and action must include an evidence array with a sourceId and an exact quote from the supplied text. Use needs_confirmation when a value is unclear.",
          },
          { role: "user", content: [{ type: "text", text: "Analyze this administrative document and return the StepWise result contract." }, documentPart(document)] },
        ],
      }),
    });

    if (!response.ok) {
      throw new LiveProviderError(`Provider request failed with status ${response.status}`);
    }

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new LiveProviderError("Provider response did not contain JSON content");
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new LiveProviderError("Provider returned invalid JSON");
    }
  }
}

export function createLiveProviderFromEnv(env: NodeJS.ProcessEnv): LiveProvider | null {
  if (!env.AI_API_KEY || !env.AI_MODEL) {
    return null;
  }
  return new OpenAICompatibleProvider({
    apiKey: env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: env.AI_MODEL,
  });
}
```

- [ ] **Step 3: Implement document processing and validation**

Create `lib/server/process-document.ts`:

```ts
import type { AnalysisResult } from "@/lib/domain/schema";
import { AnalysisValidationError, LiveProviderError } from "@/lib/server/errors";
import { validateAnalysisResult } from "@/lib/server/evidence";
import type { LiveProvider, ProviderDocument } from "@/lib/server/live-provider";

export type UploadedDocument = ProviderDocument;

export async function processLiveDocument(document: UploadedDocument, provider: LiveProvider): Promise<AnalysisResult> {
  try {
    const response = await provider.analyze(document);
    return validateAnalysisResult(response);
  } catch (error) {
    if (error instanceof LiveProviderError || error instanceof AnalysisValidationError) {
      throw error;
    }
    throw new LiveProviderError("The document could not be analyzed safely");
  }
}
```

- [ ] **Step 4: Implement the route with explicit limits and safe errors**

Create `app/api/analyze/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createLiveProviderFromEnv } from "@/lib/server/live-provider";
import { processLiveDocument } from "@/lib/server/process-document";
import { AnalysisValidationError, LiveProviderError, UploadValidationError } from "@/lib/server/errors";
import { processSample } from "@/lib/server/sample-processor";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["text/plain", "application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const mode = form.get("mode");

    if (mode === "sample") {
      return NextResponse.json(processSample("benefits-renewal"));
    }

    if (mode !== "live") {
      return NextResponse.json({ code: "MODE_INVALID", message: "Choose the sample or live document mode." }, { status: 400 });
    }

    const fileValue = form.get("file");
    if (!(fileValue instanceof File)) {
      throw new UploadValidationError("Choose a document to analyze.");
    }
    if (fileValue.size > MAX_FILE_SIZE) {
      throw new UploadValidationError("The document must be smaller than 8 MB.");
    }
    if (!ALLOWED_TYPES.has(fileValue.type)) {
      throw new UploadValidationError("Use a PDF, JPG, PNG, WebP, or plain-text document.");
    }

    const provider = createLiveProviderFromEnv(process.env);
    if (!provider) {
      return NextResponse.json({ code: "LIVE_MODE_UNAVAILABLE", message: "Live mode is not configured. Try the sample instead.", sampleAvailable: true }, { status: 503 });
    }

    const result = await processLiveDocument({
      name: fileValue.name,
      mimeType: fileValue.type,
      bytes: new Uint8Array(await fileValue.arrayBuffer()),
    }, provider);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 400 });
    }
    if (error instanceof AnalysisValidationError) {
      return NextResponse.json({ code: error.code, message: "The analysis could not be verified. Try again or use the sample." }, { status: 422 });
    }
    if (error instanceof LiveProviderError) {
      return NextResponse.json({ code: error.code, message: "The live analysis service is unavailable. Try again or use the sample." }, { status: 502 });
    }
    return NextResponse.json({ code: "REQUEST_FAILED", message: "The request could not be completed. Try again or use the sample." }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run provider and route checks**

Run:

```bash
npm run test -- tests/server/process-document.test.ts tests/server/api-route.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: sample mode returns 200 without a key, live mode without configuration returns 503 with `LIVE_MODE_UNAVAILABLE`, invalid provider results are rejected, and all commands exit with status 0.

- [ ] **Step 6: Review checkpoint**

Run `git diff --check` and inspect the route for accidental logging of `file`, `bytes`, `text`, or `AI_API_KEY`. Do not commit automatically.

---

### Task 5: Build the sample-first client state machine

**Files:**
- Modify: `components/stepwise-app.tsx`
- Create: `components/processing-view.tsx`
- Create: `components/error-state.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/e2e/stepwise.spec.ts`

**Interfaces:**
- `StepWiseApp` owns `idle | processing | success | error` state.
- `ProcessingView` receives `activeStage: number` and `stages: string[]`.
- `ErrorState` receives `message`, `onRetry`, and `onSample`.

- [ ] **Step 1: Write the failing sample-flow browser test**

Create `tests/e2e/stepwise.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("sample document becomes an action plan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await expect(page.getByRole("heading", { name: "Your action plan" })).toBeVisible();
  await expect(page.getByText("Renewal deadline")).toBeVisible();
  await expect(page.getByText("October 18, 2026")).toBeVisible();
});
```

Run `npm run e2e` and confirm the test fails because the client controls do not exist.

- [ ] **Step 2: Implement the client request state machine**

Replace the contents of `components/stepwise-app.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/domain/schema";
import { ErrorState } from "@/components/error-state";
import { ProcessingView } from "@/components/processing-view";

type AppState = "idle" | "processing" | "success" | "error";
type RequestError = { code: string; message: string };

const stages = ["Read", "Extract", "Verify", "Plan"];

export function StepWiseApp() {
  const [state, setState] = useState<AppState>("idle");
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<RequestError | null>(null);

  async function submit(mode: "sample" | "live", file?: File) {
    setState("processing");
    setStage(0);
    setError(null);
    const form = new FormData();
    form.set("mode", mode);
    if (file) form.set("file", file);

    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 550);
    try {
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw body;
      setResult(body as AnalysisResult);
      setState("success");
    } catch (requestError) {
      setError(requestError as RequestError);
      setState("error");
    } finally {
      window.clearInterval(timer);
    }
  }

  if (state === "processing") return <ProcessingView activeStage={stage} stages={stages} />;
  if (state === "error") return <ErrorState message={error?.message ?? "Something went wrong."} onRetry={() => submit("sample")} onSample={() => submit("sample")} />;
  if (state === "success" && result) return <main className="shell"><p className="eyebrow">Your action plan</p><h1>Your action plan</h1><p className="lede">{result.summary}</p><section className="start-panel"><p className="eyebrow">Key fact</p><h2>Renewal deadline</h2><p>October 18, 2026</p></section></main>;

  return (
    <main className="shell">
      <header className="topbar"><span className="wordmark">STEPWISE /</span><span className="private-label">Private session</span></header>
      <section className="hero">
        <p className="eyebrow">Administrative paperwork, made actionable</p>
        <h1>Know what to do next.</h1>
        <p className="lede">Turn a confusing notice into a short, evidence-linked plan.</p>
        <div className="hero-actions">
          <button className="button primary" onClick={() => submit("sample")}>Try the sample</button>
          <label className="button secondary" htmlFor="document-upload">Choose a document<input id="document-upload" type="file" accept="text/plain,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void submit("live", file); }} /></label>
        </div>
        <p className="microcopy">No account. No form submission. Original source links stay available.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Implement processing and error states**

Create `components/processing-view.tsx`:

```tsx
export function ProcessingView({ activeStage, stages }: { activeStage: number; stages: string[] }) {
  return (
    <main className="shell centered" role="status" aria-live="polite">
      <p className="eyebrow">StepWise is reading the document</p>
      <h1>Building your plan…</h1>
      <ol className="stage-list">
        {stages.map((label, index) => <li className={index <= activeStage ? "stage active" : "stage"} key={label}>{index < activeStage ? "✓" : index + 1} {label}</li>)}
      </ol>
    </main>
  );
}
```

Create `components/error-state.tsx`:

```tsx
export function ErrorState({ message, onRetry, onSample }: { message: string; onRetry: () => void; onSample: () => void }) {
  return (
    <main className="shell centered" role="alert">
      <p className="eyebrow">We could not finish that request</p>
      <h1>Try a different path.</h1>
      <p className="lede" data-testid="error-message">{message}</p>
      <div className="hero-actions"><button className="button primary" onClick={onRetry}>Try again</button><button className="button secondary" onClick={onSample}>Use the sample</button></div>
    </main>
  );
}
```

- [ ] **Step 4: Add the minimal shell styles**

Append these rules to `app/globals.css`:

```css
.shell { width: min(100% - 32px, 1080px); margin: 0 auto; padding: 28px 0 64px; }
.centered { min-height: 70vh; display: grid; place-content: center; justify-items: start; }
.topbar, .hero-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.wordmark { font-weight: 800; letter-spacing: -0.04em; }
.private-label, .microcopy { color: var(--muted); font-size: 13px; }
.hero { max-width: 680px; padding: 16vh 0 0; }
.eyebrow { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h1 { max-width: 680px; margin: 12px 0; font-size: clamp(42px, 8vw, 80px); line-height: .98; letter-spacing: -.06em; }
.lede { max-width: 500px; color: var(--muted); font-size: 20px; line-height: 1.4; }
.hero-actions { justify-content: flex-start; margin-top: 32px; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border: 1px solid var(--line); border-radius: 999px; }
.button.primary { border-color: var(--ink); color: white; background: var(--ink); }
.button.secondary { background: transparent; }
.button input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
.stage-list { display: grid; gap: 12px; padding: 0; list-style: none; }
.stage { color: var(--muted); }
.stage.active { color: var(--accent); font-weight: 700; }
@media (max-width: 640px) { .hero { padding-top: 12vh; } .hero-actions { align-items: stretch; flex-direction: column; } .button { width: 100%; } }
```

- [ ] **Step 5: Run the sample-flow verification**

Run:

```bash
npm run e2e -- --grep "sample document"
npm run typecheck
npm run lint
```

Expected: the sample browser test reaches `Your action plan` and the static checks pass.

- [ ] **Step 6: Review checkpoint**

Run `git diff --check` and inspect the request payload, visible privacy copy, and error recovery. Do not commit automatically.

---

### Task 6: Build the evidence-linked results workspace

**Files:**
- Create: `components/action-plan.tsx`
- Create: `components/evidence-drawer.tsx`
- Create: `components/clarification-questions.tsx`
- Modify: `components/stepwise-app.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/stepwise.spec.ts`

**Interfaces:**
- `ActionPlan` receives `{ result: AnalysisResult }` and owns selected evidence plus question answers.
- `EvidenceDrawer` receives `{ open, onClose, source, quote }`.
- `ClarificationQuestions` receives `{ questions, onAnswer }`.
- `prioritizeActions` reorders the visible action list after an answer.

- [ ] **Step 1: Extend the failing browser test with result interactions**

Append to `tests/e2e/stepwise.spec.ts`:

```ts
test("a result opens its source evidence and personalizes the order", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample" }).click();
  await page.getByRole("button", { name: "Show source" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Your annual review must be completed by October 18, 2026.");
  await page.getByRole("button", { name: "Close evidence" }).click();
  await page.getByRole("button", { name: "Gathering documents" }).click();
  await expect(page.getByText("Gather the two required documents").first()).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).first().click();
  await expect(page.getByRole("button", { name: "Mark incomplete" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Reset session" }).click();
  await expect(page.getByRole("button", { name: "Mark complete" }).first()).toBeVisible();
});
```

Run `npm run e2e -- --grep "source evidence"` and confirm the test fails because the result controls do not exist.

- [ ] **Step 2: Implement the action plan and evidence drawer**

Create `components/evidence-drawer.tsx`:

```tsx
import { useEffect } from "react";
import type { SourceSegment } from "@/lib/domain/schema";

export function EvidenceDrawer({ open, onClose, source, quote }: { open: boolean; onClose: () => void; source: SourceSegment | null; quote: string }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open || !source) return null;
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-heading"><div><p className="eyebrow">Source evidence</p><h2 id="evidence-title">{source.label}</h2></div><button className="icon-button" aria-label="Close evidence" onClick={onClose}>×</button></div>
        <p className="source-reference">Page {source.page ?? 1} · segment {source.id}</p>
        <blockquote>{quote}</blockquote>
        <p className="microcopy">This quote is linked to the result above. Confirm important information with the issuing authority.</p>
      </aside>
    </div>
  );
}
```

Create `components/action-plan.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, EvidenceRef } from "@/lib/domain/schema";
import { prioritizeActions } from "@/lib/domain/personalize";
import { ClarificationQuestions } from "@/components/clarification-questions";
import { EvidenceDrawer } from "@/components/evidence-drawer";

export function ActionPlan({ result }: { result: AnalysisResult }) {
  const [answer, setAnswer] = useState<string>();
  const [selected, setSelected] = useState<{ sourceId: string; quote: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const actions = prioritizeActions(result.actions, answer);
  const source = selected ? result.evidence.find((segment) => segment.id === selected.sourceId) ?? null : null;

  function showEvidence(reference: EvidenceRef) {
    triggerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setSelected({ sourceId: reference.sourceId, quote: reference.quote });
  }

  function closeEvidence() {
    setSelected(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  async function copyDraft() {
    if (!result.drafts[0] || !navigator.clipboard) return;
    await navigator.clipboard.writeText(result.drafts[0].body);
    setCopied(true);
  }

  function toggleComplete(actionId: string) {
    setCompleted((current) => current.includes(actionId) ? current.filter((id) => id !== actionId) : [...current, actionId]);
  }

  function resetSession() {
    setAnswer(undefined);
    setSelected(null);
    setCopied(false);
    setCompleted([]);
  }

  return (
    <main className="shell">
      <header className="topbar"><span className="wordmark">STEPWISE /</span><div className="topbar-actions"><span className="private-label">Private session</span><button className="text-button" onClick={resetSession}>Reset session</button></div></header>
      <section className="result-header"><p className="eyebrow">Your action plan</p><h1>Three things to do.</h1><p className="lede">{result.summary}</p></section>
      <section className="start-panel"><p className="eyebrow">Start here</p><h2>Check your details first.</h2><p>The notice says to contact the office if anything is incorrect. Use the source to confirm what applies.</p></section>
      <section className="plan-grid">
        <div className="action-list" aria-label="Action plan">
          {actions.map((action, index) => <article className={completed.includes(action.id) ? "action-card completed" : "action-card"} key={action.id}><span className="action-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{action.title}</h2><p>{action.reason}</p><p className="due-label">{action.dueLabel}</p><div className="action-buttons">{action.evidence[0] && <button className="text-button" onClick={() => showEvidence(action.evidence[0])}>Show source</button>}<button className="text-button" onClick={() => toggleComplete(action.id)}>{completed.includes(action.id) ? "Mark incomplete" : "Mark complete"}</button></div></div></article>)}
        </div>
        <aside className="facts-panel"><h2>Key facts</h2>{result.findings.map((finding) => <div className="fact-row" key={finding.id}><span>{finding.label}</span><strong>{finding.value}</strong>{finding.evidence[0] && <button className="text-button" onClick={() => showEvidence(finding.evidence[0])}>Show source</button>}</div>)}</aside>
      </section>
      <ClarificationQuestions questions={result.questions} onAnswer={(value) => setAnswer(value)} />
      {result.drafts[0] && <section className="draft-panel"><p className="eyebrow">Optional draft</p><h2>{result.drafts[0].title}</h2><p>{result.drafts[0].body}</p><button className="text-button" onClick={() => void copyDraft()}>{copied ? "Copied" : "Copy draft"}</button></section>}
      {result.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
      <EvidenceDrawer open={Boolean(selected)} onClose={closeEvidence} source={source} quote={selected?.quote ?? ""} />
    </main>
  );
}
```

Modify `components/stepwise-app.tsx` to import `ActionPlan` and replace the temporary success block with:

```tsx
if (state === "success" && result) return <ActionPlan result={result} />;
```

- [ ] **Step 3: Implement clarification controls**

Create `components/clarification-questions.tsx`:

```tsx
import type { Question } from "@/lib/domain/schema";

export function ClarificationQuestions({ questions, onAnswer }: { questions: Question[]; onAnswer: (actionId: string) => void }) {
  if (questions.length === 0) return null;
  return (
    <section className="questions-panel" aria-labelledby="questions-title">
      <p className="eyebrow">Make it yours</p>
      <h2 id="questions-title">Which step matters most?</h2>
      {questions.map((question) => <fieldset key={question.id}><legend>{question.prompt}</legend><div className="choice-row">{question.options.map((option) => <button className="choice-button" key={option} onClick={() => onAnswer(question.affectsActionId)}>{option}</button>)}</div></fieldset>)}
    </section>
  );
}
```

- [ ] **Step 4: Add the results styles**

Append to `app/globals.css`:

```css
.result-header { max-width: 720px; padding: 12vh 0 48px; }
.result-header h1, .centered h1 { font-size: clamp(42px, 7vw, 70px); }
.start-panel, .draft-panel, .questions-panel { max-width: 760px; padding: 24px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); }
.start-panel { margin-bottom: 32px; background: var(--ink); color: white; }
.start-panel .eyebrow { color: #b5e0bf; }
.plan-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr); gap: 24px; }
.action-list { display: grid; gap: 12px; }
.action-card { display: grid; grid-template-columns: 44px 1fr; gap: 14px; padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); }
.action-card h2, .facts-panel h2, .questions-panel h2, .draft-panel h2 { margin: 0 0 8px; font-size: 20px; }
.action-number { color: var(--accent); font-weight: 800; }
.action-card p { margin: 0 0 10px; color: var(--muted); line-height: 1.45; }
.due-label { color: var(--accent) !important; font-size: 13px; font-weight: 700; }
.facts-panel { align-self: start; padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: var(--accent-soft); }
.fact-row { display: grid; gap: 4px; padding: 14px 0; border-bottom: 1px solid rgba(36, 98, 61, .18); }
.fact-row:last-child { border-bottom: 0; }
.fact-row span { color: var(--muted); font-size: 12px; }
.fact-row strong { font-size: 15px; }
.text-button, .icon-button { border: 0; padding: 0; color: var(--accent); background: transparent; text-decoration: underline; }
.icon-button { font-size: 28px; line-height: 1; text-decoration: none; }
.topbar-actions, .action-buttons { display: flex; align-items: center; gap: 14px; }
.action-card.completed { opacity: .68; }
.action-card.completed h2 { text-decoration: line-through; }
.questions-panel, .draft-panel { margin-top: 32px; }
.questions-panel fieldset { margin: 20px 0 0; padding: 0; border: 0; }
.questions-panel legend { margin-bottom: 10px; font-weight: 700; }
.choice-row { display: flex; flex-wrap: wrap; gap: 8px; }
.choice-button { min-height: 40px; padding: 0 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); background: white; }
.choice-button:hover { border-color: var(--accent); }
.warning { max-width: 760px; padding: 14px 16px; border-left: 3px solid #c28a19; color: var(--warning); background: #fff6dd; }
.drawer-backdrop { position: fixed; inset: 0; display: flex; justify-content: flex-end; background: rgba(23, 27, 24, .35); }
.evidence-drawer { width: min(100%, 460px); height: 100%; overflow: auto; padding: 28px; background: var(--panel); box-shadow: -12px 0 30px rgba(0, 0, 0, .12); }
.drawer-heading { display: flex; justify-content: space-between; gap: 16px; }
.source-reference { color: var(--muted); font-size: 13px; }
blockquote { margin: 28px 0; padding: 20px; border-left: 4px solid var(--accent); background: var(--accent-soft); font-size: 19px; line-height: 1.45; }
@media (max-width: 720px) { .plan-grid { grid-template-columns: 1fr; } .result-header { padding-top: 9vh; } }
```

- [ ] **Step 5: Run browser and static verification**

Run:

```bash
npm run e2e -- --grep "sample document|source evidence"
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: both browser tests pass, all unit tests pass, the evidence dialog contains the source quote, and all static/build commands exit with status 0.

- [ ] **Step 6: Review checkpoint**

Inspect keyboard focus, drawer dismissal, mobile layout, and the visible non-advice copy. Run `git diff --check`. Do not commit automatically.

---

### Task 7: Add privacy, accessibility, and failure-path coverage

**Files:**
- Modify: `components/action-plan.tsx`
- Modify: `components/error-state.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/stepwise.spec.ts`
- Create: `tests/server/privacy.test.ts`

**Interfaces:**
- Error responses expose only `{ code, message }` plus `sampleAvailable` for the configuration state.
- All critical status text is exposed through an `aria-live` region or semantic alert.
- Temporary upload bytes are passed to the provider and are not written to disk by the route.

- [ ] **Step 1: Write the failing failure-path tests**

Create `tests/server/privacy.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";

beforeEach(() => {
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_MODEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("privacy boundaries", () => {
  it("does not echo uploaded content in a rejected request", async () => {
    const form = new FormData();
    form.set("mode", "live");
    form.set("file", new File(["PRIVATE CONTENT"], "private.txt", { type: "text/plain" }));
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("PRIVATE CONTENT");
  });
});
```

Append to `tests/e2e/stepwise.spec.ts`:

```ts
test("the app exposes a recovery path and privacy language", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No account. No form submission.")).toBeVisible();
  await expect(page.getByText("Original source links stay available.")).toBeVisible();
});
```

- [ ] **Step 2: Add semantic status and safe recovery behavior**

Confirm `components/processing-view.tsx` exposes the processing container with `role="status"` and `aria-live="polite"`; update `components/error-state.tsx` so the message has a stable `data-testid="error-message"`. Keep the retry and sample buttons as real buttons, ensure the file input remains keyboard reachable, and retain the no-account/no-submission copy.

- [ ] **Step 3: Add responsive and motion rules**

Add these rules to `app/globals.css`:

```css
@media (max-width: 480px) {
  .shell { width: min(100% - 24px, 1080px); padding-top: 18px; }
  .topbar { align-items: flex-start; }
  .private-label { text-align: right; }
  .start-panel, .draft-panel, .questions-panel { padding: 18px; }
  .action-card { grid-template-columns: 32px 1fr; padding: 16px; }
  .evidence-drawer { width: 100%; padding: 22px; }
}
```

The existing `@media (prefers-reduced-motion: reduce)` block remains the single reduced-motion rule set.

- [ ] **Step 4: Run the focused privacy, accessibility, and full checks**

Run:

```bash
npm run test -- tests/server/privacy.test.ts
npm run e2e
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: rejected uploads do not echo document contents, the recovery-path browser test passes, and every command exits with status 0.

- [ ] **Step 5: Review checkpoint**

Inspect the browser with keyboard-only navigation at desktop and mobile widths, confirm focus returns from the evidence dialog to its trigger, and do not commit automatically.

---

### Task 8: Generate the Devpost planning documents and shipping documentation

**Files:**
- Create or generate: `devpost/learner-profile.md`
- Create or generate: `devpost/scope.md`
- Create or generate: `devpost/prd.md`
- Create or generate: `devpost/spec.md`
- Create or generate: `devpost/checklist.md`
- Create: `README.md`
- Create: `LICENSE`
- Modify: `.env.example`
- Test: `npm run build`

**Interfaces:**
- `README.md` documents the no-key sample path first and the optional live configuration second.
- `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md` are the required event planning artifacts.
- `LICENSE` makes the open-source status detectable on the repository hosting page.

- [ ] **Step 1: Install and run the Devpost Learn Skill Pack**

Run:

```bash
npx skills add challengepost/learn-ai-basics --all -y
```

Invoke the installed `1-start`, `2-scope`, `3-prd`, and `4-spec` skills in that order. Use the approved design decisions in this plan and `docs/superpowers/specs/2026-09-24-stepwise-design.md` as the source of truth. Approve each displayed plan only after checking that the generated files contain the approved StepWise scope, PRD, and technical specification.

- [ ] **Step 2: Add the runnable-project README**

Write `README.md` with these sections and commands:

~~~markdown
# StepWise

Turn administrative paperwork into a clear, evidence-linked action plan.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL, select **Try the sample**, and follow the plan.

## Optional live mode

Copy `.env.example` to `.env.local` and set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` to a compatible endpoint. Without these values, the sample remains fully usable. Live mode accepts text, PDF, and image files up to 8 MB and validates every returned quote against the supplied source.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

## Privacy boundary

StepWise does not store documents, submit forms, or provide legal, financial, medical, or benefits advice. Temporary upload bytes are processed in memory and are not written to disk. Live provider requests are optional; the sample path sends no document to an external service.

## Hackathon artifacts

The repository includes `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, and the demo plan required for submission.
~~~

- [ ] **Step 3: Add the license and final environment documentation**

Create `LICENSE` with the MIT License text and add the year `2026` and project name `StepWise`. Keep `.env.example` values non-secret and ensure the real `.env.local` file is ignored.

- [ ] **Step 4: Run the shipping build and inspect repository contents**

Run:

```bash
npm run build
git diff --check
git status --short
```

Confirm that the status contains the source, tests, README, license, and required `devpost/` files, and that it contains no `.env.local`, API key, upload bytes, or visual-companion session files.

- [ ] **Step 5: Review checkpoint**

Read the generated `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, and README together. Make any consistency edits before the final verification pass. Do not commit automatically.

---

### Task 9: Final verification and submission handoff

**Files:**
- Modify only files needed to resolve verification findings.
- Do not create secrets, credentials, or generated upload data.

**Interfaces:**
- The completed project is runnable with `npm install`, `npm run dev`, and the bundled sample.
- The submission materials are the public repository, English description, and public YouTube or Vimeo video under three minutes.

- [ ] **Step 1: Run the complete quality gate**

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
git diff --check
```

Expected: every command exits with status 0; unit and browser tests report no failures.

- [ ] **Step 2: Verify the hackathon artifact checklist**

Confirm each item directly:

```text
[ ] npm install succeeds
[ ] npm run dev starts the app
[ ] Try the sample works without a key
[ ] live mode without a key offers the sample
[ ] source evidence opens from a result
[ ] no document contents appear in rejection responses
[ ] devpost/scope.md exists
[ ] devpost/prd.md exists
[ ] devpost/spec.md exists
[ ] devpost/checklist.md exists
[ ] README.md contains setup and privacy boundaries
[ ] LICENSE is present
[ ] repository contains no secrets
[ ] demo video plan is under three minutes
```

- [ ] **Step 3: Prepare the human submission fields**

Write the project name, short description, repository URL, and demo-video link from the user's own final project details. Do not invent awards, public URLs, test results, or participant claims. Stop before publishing or committing unless explicitly requested.

- [ ] **Step 4: Final review checkpoint**

Show the user the command results, changed-file list, and any remaining submission-only actions. Do not claim completion until every command above has fresh passing output.
