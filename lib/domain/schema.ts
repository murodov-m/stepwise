import { z } from "zod";

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export const sourceSegmentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  page: z.number().int().positive().optional(),
  text: z.string().min(1),
});

export const evidenceRefSchema = z.object({
  sourceId: z.string().min(1),
  quote: z.string().trim().min(1),
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
  dueDate: z.string().refine(isCalendarDate).optional(),
  dueKind: z.enum(["source", "suggested", "none"]).default("none"),
  dueLabel: z.string().min(1),
  status: z.enum(["pending", "completed"]),
  evidenceStatus: claimStatusSchema.default("linked"),
  requiredDocuments: z.array(z.string()),
  evidence: z.array(evidenceRefSchema),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  affectsActionId: z.string().min(1).optional().describe("Guidance target for the built-in address and documents-ready questions only; not a generic priority fallback."),
  optionActions: z.record(z.string(), z.string().min(1)).default({}).describe("Map every offered option to an existing action ID to prioritize it. With affectsActionId, built-in address guidance covers Yes/No/Not sure and documents-ready guidance covers Yes/No/Partly/Not sure."),
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
