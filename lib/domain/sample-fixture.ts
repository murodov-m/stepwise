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
      dueKind: "suggested",
      dueLabel: "Suggested: do this first",
      status: "pending",
      evidenceStatus: "linked",
      requiredDocuments: [],
      evidence: [{ sourceId: "source-1", quote: "Please review the information below and contact the office if anything is incorrect." }],
    },
    {
      id: "gather-documents",
      title: "Gather the two required documents",
      reason: "The notice lists proof of income and photo identification.",
      dueKind: "suggested",
      dueLabel: "Suggested: about one week before the deadline",
      status: "pending",
      evidenceStatus: "linked",
      requiredDocuments: ["Proof of income", "Current photo identification"],
      evidence: [{ sourceId: "source-1", quote: "1. Proof of income dated within the last 60 days." }, { sourceId: "source-1", quote: "2. A current photo identification document." }],
    },
    {
      id: "submit-review",
      title: "Review the renewal before submitting",
      reason: "The annual review must be completed by the stated deadline.",
      dueDate: "2026-10-18",
      dueKind: "source",
      dueLabel: "Due October 18, 2026",
      status: "pending",
      evidenceStatus: "linked",
      requiredDocuments: [],
      evidence: [{ sourceId: "source-1", quote: "Your annual review must be completed by October 18, 2026." }],
    },
  ],
  questions: [
    { id: "priority", prompt: "What should StepWise prioritize first?", options: ["Understanding the notice", "Gathering documents", "Meeting the deadline"], affectsActionId: "check-details", optionActions: {"Understanding the notice": "check-details", "Gathering documents": "gather-documents", "Meeting the deadline": "submit-review"} },
    { id: "address", prompt: "Did your address change?", options: ["No", "Yes", "Not sure"], affectsActionId: "check-details", optionActions: {Yes: "check-details", "Not sure": "check-details"} },
    { id: "documents-ready", prompt: "Are the two required documents ready?", options: ["Yes", "No", "Partly", "Not sure"], affectsActionId: "gather-documents", optionActions: {Yes: "submit-review", No: "gather-documents", Partly: "gather-documents", "Not sure": "gather-documents"} },
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
