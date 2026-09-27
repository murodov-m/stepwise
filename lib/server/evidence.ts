import { analysisResultSchema, sourceSegmentSchema, type AnalysisResult, type EvidenceRef, type SourceSegment } from "@/lib/domain/schema";
import { AnalysisValidationError } from "@/lib/server/errors";
import { hasBuiltInAnswerGuidance } from "@/lib/domain/personalize";

export { AnalysisValidationError };

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function assertEvidence(evidence: EvidenceRef[], sources: Map<string, string>): void {
  for (const reference of evidence) {
    const source = sources.get(reference.sourceId);
    if (!source) {
      throw new AnalysisValidationError(`Unknown evidence source: ${reference.sourceId}`);
    }
    if (!normalized(reference.quote) || !normalized(source).includes(normalized(reference.quote))) {
      throw new AnalysisValidationError("An evidence quote is not present in its source segment");
    }
  }
}

export function validateAnalysisResult(input: unknown, authoritativeSources: SourceSegment[]): AnalysisResult {
  let result: AnalysisResult;
  try {
    result = analysisResultSchema.parse(input);
  } catch {
    throw new AnalysisValidationError("The analysis response does not match the StepWise contract");
  }
  const unique = (entities: { id: string }[]) => {
    if (new Set(entities.map((item) => item.id)).size !== entities.length) throw new AnalysisValidationError("Duplicate entity IDs");
  };
  if (!authoritativeSources?.length || authoritativeSources.some((source) => !sourceSegmentSchema.safeParse(source).success || !normalized(source.text))) throw new AnalysisValidationError("Missing authoritative sources");
  [authoritativeSources, result.evidence, result.findings, result.actions, result.questions, result.drafts].forEach(unique);
  const sources = new Map(authoritativeSources.map((segment) => [segment.id, segment.text]));
  if (result.evidence.length !== sources.size || result.evidence.some((source) => sources.get(source.id) !== source.text)) throw new AnalysisValidationError("Returned source content is inconsistent with the document");
  const actionIds = new Set(result.actions.map((action) => action.id));
  for (const question of result.questions) {
    if (new Set(question.options).size !== question.options.length || (question.affectsActionId && !actionIds.has(question.affectsActionId)) || Object.entries(question.optionActions).some(([option, id]) => !question.options.includes(option) || !actionIds.has(id))) throw new AnalysisValidationError("Invalid question/action mapping");
    if (question.options.some(option => !Object.hasOwn(question.optionActions, option) && !hasBuiltInAnswerGuidance(question, option))) throw new AnalysisValidationError("Every offered question choice needs a supported action effect");
  }

  for (const finding of result.findings) {
    if (finding.status === "linked" && finding.evidence.length === 0) {
      throw new AnalysisValidationError(`Finding ${finding.id} needs evidence`);
    }
    assertEvidence(finding.evidence, sources);
  }

  for (const action of result.actions) {
    if (action.evidenceStatus === "linked" && action.evidence.length === 0) {
      throw new AnalysisValidationError(`Action ${action.id} needs evidence`);
    }
    assertEvidence(action.evidence, sources);
    if ((action.dueDate && action.dueKind === "none") || (!action.dueDate && action.dueKind === "source")) throw new AnalysisValidationError("Inconsistent deadline kind");
  }

  for (const draft of result.drafts) {
    assertEvidence(draft.evidence, sources);
  }

  return { ...result, evidence: authoritativeSources.map((source) => ({...source})) };
}
