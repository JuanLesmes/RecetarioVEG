import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  /** Verbo del botón de quitar; por defecto "Quitar filtro". */
  removeLabel?: string;
  accent?: boolean;
  title?: string;
  count?: number;
}

export function Chip({ children, selected = false, onClick, onRemove, removeLabel = 'Quitar filtro', accent = false, title, count }: ChipProps) {
  const cls = ['chip', accent ? 'chip--accent' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
  const inner = (
    <>
      {children}
      {typeof count === 'number' ? <span className="filters__count">{count}</span> : null}
      {onRemove ? (
        <span className="chip__remove" aria-hidden="true">
          <Icon name="x" style={{ width: '0.9em', height: '0.9em' }} />
        </span>
      ) : null}
    </>
  );
  if (onClick || onRemove) {
    return (
      <button
        type="button"
        className={cls}
        onClick={onRemove ?? onClick}
        aria-pressed={onRemove ? undefined : selected}
        title={title}
        aria-label={onRemove ? `${removeLabel} ${typeof children === 'string' ? children : ''}`.trim() : undefined}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {inner}
    </span>
  );
}
