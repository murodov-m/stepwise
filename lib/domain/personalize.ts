import type { Action, Question } from "@/lib/domain/schema";

export type QuestionAnswers = Record<string, string>;

// These existing sample question types consume affectsActionId in their guidance.
// It is not a generic priority fallback.
export function hasBuiltInAnswerGuidance(question: Question, option: string): boolean {
  if (!question.affectsActionId) return false;
  if (question.id === "documents-ready") return ["Yes", "No", "Partly", "Not sure"].includes(option);
  if (question.id === "address") return ["Yes", "No", "Not sure"].includes(option);
  return false;
}

export function prioritizeActions(actions: Action[], questionsOrPriority?: string | Question[], answers: QuestionAnswers = {}): Action[] {
  if (Array.isArray(questionsOrPriority)) {
    actions = actions.map((action) => {
      let reason = action.reason;
      const readiness = questionsOrPriority.find(q => q.id === "documents-ready" && q.affectsActionId === action.id);
      const address = questionsOrPriority.find(q => q.id === "address" && q.affectsActionId === action.id);
      if (readiness?.options.includes(answers[readiness.id]) && hasBuiltInAnswerGuidance(readiness, answers[readiness.id])) {
        const selected = answers[readiness.id];
        reason += selected === "Yes" ? " You said the documents are ready; check their dates before submitting." : selected === "Partly" ? " Gather the remaining documents you have not prepared." : selected === "No" ? " You said neither document is ready; prepare both before submitting." : " Confirm which required documents you already have.";
      }
      if (address?.options.includes(answers[address.id]) && hasBuiltInAnswerGuidance(address, answers[address.id])) {
        const selected = answers[address.id];
        reason += selected === "Yes" ? " You said your address changed; confirm the update with the issuing office." : selected === "No" ? " You said your address is unchanged; review the other details." : " Confirm whether the address on the notice is current.";
      }
      return {...action, reason};
    });
  }
  const answer = typeof questionsOrPriority === "string" ? questionsOrPriority : questionsOrPriority?.map((question) => question.optionActions[answers[question.id]]).find(Boolean);
  if (!answer) {
    return [...actions];
  }

  const index = actions.findIndex((action) => action.id === answer);
  if (index < 0) {
    return [...actions];
  }

  return [actions[index], ...actions.slice(0, index), ...actions.slice(index + 1)];
}
