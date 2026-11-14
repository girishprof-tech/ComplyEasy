import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Backdrop + dialog shell. Clicking the backdrop closes; clicks inside do not. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 style={{ marginBottom: 18 }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  );
}
