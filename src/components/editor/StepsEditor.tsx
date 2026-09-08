import { RECIPE_LIMITS } from '@/domain/recipe';
import { extractMinutes } from '@/domain/text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface StepsEditorProps {
  steps: string[];
  onChange: (steps: string[]) => void;
  errors?: string[];
}

export function StepsEditor({ steps, onChange, errors = [] }: StepsEditorProps) {
  const update = (idx: number, value: string) => onChange(steps.map((s, j) => (j === idx ? value : s)));
  const remove = (idx: number) => onChange(steps.filter((_, j) => j !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => {
    if (steps.length >= RECIPE_LIMITS.steps.max) return;
    onChange([...steps, '']);
  };

  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>Preparación</h3>
          <p className="muted">
            Entre {RECIPE_LIMITS.steps.min} y {RECIPE_LIMITS.steps.max} pasos, en imperativo ("Pica", "Sofríe"). Si escribes tiempos ("cocina 15 minutos") la app crea temporizadores.
          </p>
        </div>
      </div>

      {errors.length > 0 ? (
        <ul className="field-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <ol className="step-rows">
        {steps.map((step, idx) => {
          const minutes = extractMinutes(step);
          const short = step.trim().length > 0 && step.trim().length < RECIPE_LIMITS.stepText.min;
          return (
            <li key={idx} className="step-row">
              <span className="step__num" aria-hidden="true">
                {idx + 1}
              </span>
              <div className="step-row__body">
                <textarea
                  className="input step-row__text"
                  rows={2}
                  value={step}
                  maxLength={RECIPE_LIMITS.stepText.max}
                  placeholder={idx === 0 ? 'Pica la cebolla y sofríela 5 minutos a fuego medio…' : 'Siguiente paso…'}
                  onChange={(e) => update(idx, e.target.value)}
                  aria-label={`Paso ${idx + 1}`}
                  data-testid={`step-text-${idx}`}
                />
                <div className="step-row__meta">
                  {minutes.map((m) => (
                    <span key={m} className="chip">
                      <Icon name="timer" /> {m} min
                    </span>
                  ))}
                  {short ? <span className="field-hint field-hint--warn">Describe un poco más este paso</span> : null}
                  <span className="muted step-row__count">
                    {step.trim().length}/{RECIPE_LIMITS.stepText.max}
                  </span>
                </div>
              </div>
              <div className="step-row__actions">
                <Button variant="ghost" icon="arrow-up" iconOnly size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  Subir paso
                </Button>
                <Button variant="ghost" icon="arrow-down" iconOnly size="sm" onClick={() => move(idx, 1)} disabled={idx === steps.length - 1}>
                  Bajar paso
                </Button>
                <Button variant="ghost" icon="trash" iconOnly size="sm" onClick={() => remove(idx)} disabled={steps.length <= 1}>
                  Quitar paso {idx + 1}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <Button variant="secondary" icon="plus" onClick={add} disabled={steps.length >= RECIPE_LIMITS.steps.max} data-testid="add-step">
        Agregar paso ({steps.length}/{RECIPE_LIMITS.steps.max})
      </Button>
    </div>
  );
}
