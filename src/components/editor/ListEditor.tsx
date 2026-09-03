import { Button } from '@/components/ui/Button';

interface ListEditorProps {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  min: number;
  max: number;
  placeholder?: string;
  errors?: string[];
  testId?: string;
}

/** Editor de listas de texto corto (consejos). */
export function ListEditor({ label, hint, items, onChange, min, max, placeholder, errors = [], testId }: ListEditorProps) {
  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>{label}</h3>
          {hint ? <p className="muted">{hint}</p> : null}
        </div>
      </div>
      {errors.length > 0 ? (
        <ul className="field-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <ul className="list-rows">
        {items.map((item, idx) => (
          <li key={idx} className="list-row">
            <input
              className="input"
              value={item}
              placeholder={placeholder}
              onChange={(e) => onChange(items.map((v, j) => (j === idx ? e.target.value : v)))}
              aria-label={`${label} ${idx + 1}`}
              data-testid={testId ? `${testId}-${idx}` : undefined}
            />
            <Button variant="ghost" icon="trash" iconOnly size="sm" onClick={() => onChange(items.filter((_, j) => j !== idx))} disabled={items.length <= Math.max(1, min)}>
              Quitar {label.toLowerCase()} {idx + 1}
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" icon="plus" size="sm" onClick={() => onChange([...items, ''])} disabled={items.length >= max}>
        Agregar ({items.length}/{max})
      </Button>
    </div>
  );
}
