import { useMemo, useState } from 'react';
import { RECIPE_LIMITS, UNITS, type Ingredient, type Unit } from '@/domain/recipe';
import { scaleIngredients } from '@/domain/scaling';
import { suggestColombianName } from '@/domain/recipeAssistant';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface IngredientsEditorProps {
  ingredients: Ingredient[];
  servings: number;
  onChange: (ingredients: Ingredient[]) => void;
  glossary: ReadonlyMap<string, string>;
  vocabulary: readonly string[];
  errors?: string[];
}

const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  cucharada: 'cucharada(s)',
  cucharadita: 'cucharadita(s)',
  taza: 'taza(s)',
  unidad: 'unidad(es)',
  pizca: 'pizca(s)',
  diente: 'diente(s)',
  rama: 'rama(s)',
  hoja: 'hoja(s)',
  rebanada: 'tajada(s)',
  lata: 'lata(s)',
  puñado: 'puñado(s)',
  sobre: 'sobre(s)',
  manojo: 'manojo(s)',
  chorrito: 'chorrito(s)',
};

export function IngredientsEditor({ ingredients, servings, onChange, glossary, vocabulary, errors = [] }: IngredientsEditorProps) {
  const [perServing, setPerServing] = useState(false);
  const preview = useMemo(() => (perServing ? scaleIngredients(ingredients, servings, 1) : null), [ingredients, servings, perServing]);

  const update = (idx: number, patch: Partial<Ingredient>) => onChange(ingredients.map((i, j) => (j === idx ? { ...i, ...patch } : i)));
  const remove = (idx: number) => onChange(ingredients.filter((_, j) => j !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= ingredients.length) return;
    const next = [...ingredients];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => {
    if (ingredients.length >= RECIPE_LIMITS.ingredients.max) return;
    onChange([...ingredients, { name: '', quantity: null, unit: null }]);
  };

  return (
    <div className="editor-block">
      <div className="editor-block__head">
        <div>
          <h3>Ingredientes</h3>
          <p className="muted">
            Para <strong>{servings}</strong> {servings === 1 ? 'porción' : 'porciones'}. Entre {RECIPE_LIMITS.ingredients.min} y {RECIPE_LIMITS.ingredients.max}; usa los nombres como se compran en Colombia.
          </p>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={perServing} onChange={(e) => setPerServing(e.target.checked)} />
          <span>Ver cantidades por porción</span>
        </label>
      </div>

      {errors.length > 0 ? (
        <ul className="field-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <datalist id="ingredient-vocabulary">
        {vocabulary.slice(0, 400).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <ol className="ingredient-rows" data-testid="ingredient-rows">
        {ingredients.map((ing, idx) => {
          const suggestion = ing.name.trim() ? suggestColombianName(ing.name, glossary) : null;
          const alGusto = ing.unit === null && ing.quantity === null;
          return (
            <li key={idx} className="ingredient-row">
              <span className="ingredient-row__num" aria-hidden="true">
                {idx + 1}
              </span>
              <label className="field ingredient-row__qty">
                <span className="field__label">Cantidad</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={ing.quantity ?? ''}
                  disabled={alGusto}
                  placeholder={alGusto ? '—' : '2'}
                  onChange={(e) => update(idx, { quantity: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) || null })}
                  aria-label={`Cantidad del ingrediente ${idx + 1}`}
                />
              </label>
              <label className="field ingredient-row__unit">
                <span className="field__label">Unidad</span>
                <select
                  className="input"
                  value={ing.unit ?? ''}
                  onChange={(e) => {
                    const unit = (e.target.value || null) as Unit | null;
                    update(idx, unit === null ? { unit: null, quantity: null, note: ing.note || 'al gusto' } : { unit, quantity: ing.quantity ?? 1, note: ing.note === 'al gusto' ? undefined : ing.note });
                  }}
                  aria-label={`Unidad del ingrediente ${idx + 1}`}
                >
                  <option value="">al gusto</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field ingredient-row__name">
                <span className="field__label">Ingrediente</span>
                <input
                  className="input"
                  list="ingredient-vocabulary"
                  value={ing.name}
                  placeholder="ej. cebolla larga"
                  onChange={(e) => update(idx, { name: e.target.value })}
                  aria-label={`Nombre del ingrediente ${idx + 1}`}
                  data-testid={`ingredient-name-${idx}`}
                />
                {suggestion ? (
                  <button type="button" className="inline-suggestion" onClick={() => update(idx, { name: suggestion, aliases: [...new Set([...(ing.aliases ?? []), ing.name.trim().toLowerCase()])].slice(0, 6) })}>
                    <Icon name="sparkles" /> En Colombia: <strong>{suggestion}</strong>
                  </button>
                ) : null}
              </label>
              <label className="field ingredient-row__note">
                <span className="field__label">Nota</span>
                <input className="input" value={ing.note ?? ''} placeholder="picada, escurridos…" onChange={(e) => update(idx, { note: e.target.value || undefined })} aria-label={`Nota del ingrediente ${idx + 1}`} />
              </label>
              <div className="ingredient-row__actions">
                <Button variant="ghost" icon="arrow-up" iconOnly size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  Subir
                </Button>
                <Button variant="ghost" icon="arrow-down" iconOnly size="sm" onClick={() => move(idx, 1)} disabled={idx === ingredients.length - 1}>
                  Bajar
                </Button>
                <Button variant="ghost" icon="trash" iconOnly size="sm" onClick={() => remove(idx)} disabled={ingredients.length <= 1}>
                  Quitar ingrediente {idx + 1}
                </Button>
              </div>
              {preview ? <p className="ingredient-row__preview muted">Por porción: {preview[idx].display || '—'}</p> : null}
            </li>
          );
        })}
      </ol>

      <Button variant="secondary" icon="plus" onClick={add} disabled={ingredients.length >= RECIPE_LIMITS.ingredients.max} data-testid="add-ingredient">
        Agregar ingrediente ({ingredients.length}/{RECIPE_LIMITS.ingredients.max})
      </Button>
    </div>
  );
}
