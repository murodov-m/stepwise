import { useEffect, useRef } from "react";
import type { SourceSegment } from "@/lib/domain/schema";

export function EvidenceDrawer({ onClose, source, quote }: { onClose: () => void; source: SourceSegment; quote: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => dialog?.close();
  }, []);
  return (
    <dialog className="evidence-drawer" ref={dialogRef} aria-labelledby="evidence-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }} onKeyDown={event => {
      // The close button is the dialog's only interactive control.
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    }}>
      <div className="drawer-heading"><div><p className="eyebrow">Source evidence</p><h2 id="evidence-title">{source.label}</h2></div><button ref={closeRef} className="icon-button" aria-label="Close evidence" onClick={onClose}>×</button></div>
      <p className="source-reference">{source.page ? `Page ${source.page} · ` : ""}Segment {source.id}</p>
      <blockquote>{quote}</blockquote>
      <p className="microcopy">This passage is linked to the plan. A source link shows where text came from; it does not prove that the interpretation is correct. Confirm important details with the issuing office.</p>
    </dialog>
  );
}
