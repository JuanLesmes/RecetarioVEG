import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Diálogo modal accesible basado en el elemento nativo <dialog>. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (e.target === el) onClose();
    };
    el.addEventListener('cancel', handleCancel);
    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('cancel', handleCancel);
      el.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-title">
      <div className="dialog__panel">
        <div className="dialog__header">
          <h3 id="dialog-title">{title}</h3>
          <Button variant="ghost" icon="x" iconOnly size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <div className="dialog__body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
