import type { Question } from "@/lib/domain/schema";
import type { QuestionAnswers } from "@/lib/domain/personalize";

export function ClarificationQuestions({ questions, answers, onAnswer }: { questions: Question[]; answers: QuestionAnswers; onAnswer: (questionId: string, option: string) => void }) {
  if (!questions.length) return null;
  return (
    <section className="questions-panel" aria-labelledby="questions-title">
      <p className="eyebrow">Make it yours</p><h2 id="questions-title">Adjust your plan</h2>
      {questions.map(question => <fieldset key={question.id}>
        <legend>{question.prompt}</legend>
        <div className="choice-row">{question.options.map(option => <button className="choice-button" key={option} aria-pressed={answers[question.id] === option} onClick={() => onAnswer(question.id, option)}>{option}</button>)}</div>
      </fieldset>)}
    </section>
  );
}
