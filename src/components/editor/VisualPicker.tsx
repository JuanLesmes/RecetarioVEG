import { VISUAL_LABELS, VISUALS, type Category, type Visual } from '@/domain/recipe';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

interface VisualPickerProps {
  value: Visual | undefined;
  suggested?: Visual;
  category: Category;
  onChange: (visual: Visual) => void;
}

export function VisualPicker({ value, suggested, category, onChange }: VisualPickerProps) {
  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>Ilustración</h3>
          <p className="muted">Elige el dibujo que más se parezca a tu plato. {suggested ? `Sugerido: ${VISUAL_LABELS[suggested].split(' (')[0]}.` : ''}</p>
        </div>
      </div>
      <div className="visual-grid" role="radiogroup" aria-label="Ilustración de la receta">
        {VISUALS.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={['visual-option', value === v ? 'is-selected' : '', suggested === v ? 'is-suggested' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(v)}
            title={VISUAL_LABELS[v]}
            data-testid={`visual-${v}`}
          >
            <span className="visual-option__art" style={{ background: `var(--cat-${category})` }}>
              <DishIllustration name={v} />
            </span>
            <span className="visual-option__label">{VISUAL_LABELS[v].split(' (')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
