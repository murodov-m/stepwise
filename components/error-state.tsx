export function ErrorState({ message, onRetry, onSample, onReplace }: { message: string; onRetry?: () => void; onSample: () => void; onReplace: () => void }) {
  return (
    <main className="shell centered">
      <div role="alert"><p className="eyebrow">We could not finish that request</p><h1>Try a different path.</h1><p className="lede" data-testid="error-message">{message}</p></div>
      <div className="hero-actions">
        {onRetry && <button className="button secondary" onClick={onRetry}>Try again</button>}
        <button className="button primary" onClick={onSample}>Use the sample</button>
        <button className="button secondary" onClick={onReplace}>Choose another document</button>
      </div>
    </main>
  );
}
