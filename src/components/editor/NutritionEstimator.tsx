import { useMemo } from 'react';
import type { Ingredient, Nutrition } from '@/domain/recipe';
import { estimateNutrition } from '@/domain/nutrition';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface NutritionEstimatorProps {
  ingredients: Ingredient[];
  servings: number;
  value: Nutrition;
  onChange: (nutrition: Nutrition) => void;
  errors?: string[];
}

const FIELDS: { key: keyof Nutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteína', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
];

export function NutritionEstimator({ ingredients, servings, value, onChange, errors = [] }: NutritionEstimatorProps) {
  const estimate = useMemo(() => estimateNutrition(ingredients, servings), [ingredients, servings]);
  const canEstimate = estimate.lines.length > 0;
  const coverage = Math.round(estimate.coverage * 100);

  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>Nutrición por porción</h3>
          <p className="muted">Valores aproximados. Puedes estimarlos automáticamente a partir de los ingredientes y ajustarlos a mano.</p>
        </div>
        <Button variant="primary" icon="sparkles" size="sm" onClick={() => onChange(estimate.perServing)} disabled={!canEstimate} data-testid="estimate-nutrition">
          Estimar automáticamente
        </Button>
      </div>

      {errors.length > 0 ? (
        <ul className="field-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <div className="nutrition-inputs">
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span className="field__label">
              {f.label} ({f.unit})
            </span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
              aria-label={`${f.label} por porción`}
              data-testid={`nutrition-${f.key}`}
            />
          </label>
        ))}
      </div>

      {canEstimate ? (
        <details className="estimate">
          <summary>
            <Icon name="info" /> Cómo se calculó la estimación ({coverage}% de los ingredientes con cantidad reconocidos)
          </summary>
          <p className="muted">
            Estimado por porción: {estimate.perServing.calories} kcal · {estimate.perServing.protein} g proteína · {estimate.perServing.carbs} g carbohidratos · {estimate.perServing.fat} g grasa ·{' '}
            {estimate.perServing.fiber} g fibra.
          </p>
          <ul className="estimate__lines">
            {estimate.lines.slice(0, 8).map((l) => (
              <li key={l.name}>
                <span>{l.name}</span>
                <span className="muted">
                  ≈ {Math.round(l.grams)} g · {Math.round(l.calories)} kcal en total
                </span>
              </li>
            ))}
          </ul>
          {estimate.unmatched.length > 0 ? (
            <p className="field-hint field-hint--warn">
              No reconocimos: {estimate.unmatched.join(', ')}. Revisa el nombre (por ejemplo "cebolla cabezona" en vez de "cebolla grande") o ajusta los valores a mano.
            </p>
          ) : null}
          {estimate.skipped.length > 0 ? <p className="muted">Sin cantidad (no cuentan): {estimate.skipped.join(', ')}.</p> : null}
        </details>
      ) : (
        <p className="muted">Escribe ingredientes con cantidad y unidad para poder estimar.</p>
      )}
    </div>
  );
}
