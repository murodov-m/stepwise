"use client";

import { useId, useRef, useState } from "react";
import type { AnalysisResult, Draft, EvidenceRef } from "@/lib/domain/schema";
import { prioritizeActions, type QuestionAnswers } from "@/lib/domain/personalize";
import { getActionDueLabel } from "@/lib/domain/deadlines";
import { ClarificationQuestions } from "@/components/clarification-questions";
import { EvidenceDrawer } from "@/components/evidence-drawer";

function SourceLinks({ references, onShow }: { references: EvidenceRef[]; onShow: (reference: EvidenceRef) => void }) {
  return <div className="source-links">{references.map((reference, index) => <button className="text-button" key={`${reference.sourceId}-${index}`} onClick={() => onShow(reference)}>Show source {index + 1}</button>)}</div>;
}

function DraftPanel({ draft, onShow }: { draft: Draft; onShow: (reference: EvidenceRef) => void }) {
  const textId = useId();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copyDraft() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(draft.body);
      setCopyStatus("copied");
    } catch { setCopyStatus("failed"); }
  }
  return <section className="draft-panel">
    <p className="eyebrow">Optional draft · review before sending</p><h2>{draft.title}</h2>
    <label className="sr-only" htmlFor={textId}>{draft.title}</label>
    <textarea id={textId} rows={5} readOnly value={draft.body} />
    <div className="action-buttons"><SourceLinks references={draft.evidence} onShow={onShow} /><button className="text-button" onClick={() => void copyDraft()}>Copy draft</button></div>
    <p role="status" className="microcopy">{copyStatus === "copied" ? "Copied. Review the draft before sending." : copyStatus === "failed" ? "Copy was unavailable. Select the draft text and copy it manually." : "Nothing is sent automatically."}</p>
  </section>;
}

export function ActionPlan({ result, mode, onNewDocument }: { result: AnalysisResult; mode: "sample" | "live"; onNewDocument: () => void }) {
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [selected, setSelected] = useState<EvidenceRef | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(result.actions.filter(action => action.status === "completed").map(action => action.id)));
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const actions = prioritizeActions(result.actions, result.questions, answers);
  const remaining = actions.filter(action => !completed.has(action.id));
  const nextAction = remaining[0];
  const source = selected ? result.evidence.find(segment => segment.id === selected.sourceId) : undefined;

  function showEvidence(reference: EvidenceRef) {
    triggerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setSelected(reference);
  }
  function closeEvidence() {
    setSelected(null);
    // Native dialog also restores focus; this preserves the exact triggering link.
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }
  function toggleComplete(actionId: string) {
    setCompleted(current => {
      const updated = new Set(current);
      if (updated.has(actionId)) updated.delete(actionId); else updated.add(actionId);
      return updated;
    });
  }

  return (
    <main className="shell">
      <header className="topbar"><span className="wordmark">STEPWISE /</span><div className="topbar-actions"><span className="private-label">Temporary session</span><button className="text-button" onClick={onNewDocument}>New document</button><button className="text-button" onClick={onNewDocument}>Reset session</button></div></header>
      <section className="result-header">
        <p className="eyebrow">{mode === "sample" ? "Sample plan" : "Your action plan"}</p>
        <h1 aria-live="polite">{remaining.length} {remaining.length === 1 ? "action" : "actions"} left.</h1><p className="lede">{result.summary}</p>
        {mode === "sample" && <p className="microcopy">A fixed example notice. Your answers adjust the order and guidance.</p>}
        <p className="microcopy">Source-linked means a passage supports the plan, not that the interpretation is verified. This is an informational aid, not legal, financial, or eligibility advice.</p>
      </section>
      <section className="start-panel" aria-live="polite">
        <p className="eyebrow">{nextAction ? "Start here" : "Plan complete"}</p><h2>{nextAction?.title ?? "All actions complete"}</h2>
        <p>{nextAction?.reason ?? "You marked every action complete. Confirm the requirements with the issuing office before submitting anything."}</p>
        {nextAction && <p>{getActionDueLabel(nextAction)}</p>}
      </section>
      <section className="plan-grid">
        <div className="action-list" aria-label="Action plan">
          {actions.map((action, index) => <article className={completed.has(action.id) ? "action-card completed" : "action-card"} key={action.id}>
            <span className="action-number">{String(index + 1).padStart(2, "0")}</span><div>
              <h2>{action.title}</h2><p>{action.reason}</p>
              <span className={action.evidenceStatus === "needs_confirmation" ? "badge confirmation" : "badge"}>{action.evidenceStatus === "needs_confirmation" ? "Needs confirmation" : "Source-linked"}</span>
              <p className="due-label">{action.dueKind === "source" && <span>Source deadline · </span>}{getActionDueLabel(action)}</p>
              {action.requiredDocuments.length > 0 && <div className="required-documents"><h3>Required documents</h3><ul>{action.requiredDocuments.map(document => <li key={document}>{document}</li>)}</ul></div>}
              <div className="action-buttons"><SourceLinks references={action.evidence} onShow={showEvidence} /><button className="text-button" aria-pressed={completed.has(action.id)} onClick={() => toggleComplete(action.id)}>{completed.has(action.id) ? "Mark incomplete" : "Mark complete"}</button></div>
            </div>
          </article>)}
        </div>
        <aside className="facts-panel"><h2>Key facts</h2>{result.findings.map(finding => <div className="fact-row" key={finding.id}>
          <span>{finding.label}</span><strong>{finding.value}</strong><span className={finding.status === "needs_confirmation" ? "badge confirmation" : "badge"}>{finding.status === "needs_confirmation" ? "Needs confirmation" : "Source-linked"}</span><SourceLinks references={finding.evidence} onShow={showEvidence} />
        </div>)}</aside>
      </section>
      <ClarificationQuestions questions={result.questions} answers={answers} onAnswer={(questionId, option) => setAnswers(current => ({ ...current, [questionId]: option }))} />
      {result.drafts.map(draft => <DraftPanel key={draft.id} draft={draft} onShow={showEvidence} />)}
      {result.warnings.map((warning, index) => <p className="warning" key={index}>{warning}</p>)}
      <p className="microcopy boundary">Confirm important details against the original document and with the issuing office. Completing an action here only updates this temporary plan.</p>
      {selected && source && <EvidenceDrawer onClose={closeEvidence} source={source} quote={selected.quote} />}
    </main>
  );
}
