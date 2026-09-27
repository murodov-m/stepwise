export function ProcessingView({ onCancel }: { onCancel: () => void }) {
  return (
    <main className="shell centered">
      <div role="status" aria-live="polite">
        <p className="eyebrow">Analysis in progress</p>
        <h1>Building your plan…</h1>
        <p>Waiting for a complete response. This may take up to 100 seconds.</p>
        <ol className="stage-list" aria-label="Processing may include these steps">
          <li className="stage">Read the document</li><li className="stage">Extract source passages</li><li className="stage">Check source links</li><li className="stage">Build an action plan</li>
        </ol>
        <p className="microcopy">These are processing steps, not a live progress report. Source links do not verify an interpretation.</p>
      </div>
      <button className="button secondary" onClick={onCancel}>Cancel analysis</button>
    </main>
  );
}
