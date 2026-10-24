import type { ReactNode } from 'react';

/** Backdrop + dialog shell. Clicking the backdrop closes; clicks inside do not. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
