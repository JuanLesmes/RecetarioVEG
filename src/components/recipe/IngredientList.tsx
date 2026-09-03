import { useState } from 'react';
import type { ScaledIngredient } from '@/domain/scaling';

interface IngredientListProps {
  ingredients: ScaledIngredient[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  const toggle = (idx: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  return (
    <ul className="ingredients" data-testid="ingredient-list">
      {ingredients.map((ing, idx) => {
        const isChecked = checked.has(idx);
        return (
          <li key={`${ing.name}-${idx}`}>
            <label className={['ingredient', isChecked ? 'is-checked' : ''].filter(Boolean).join(' ')}>
              <input type="checkbox" checked={isChecked} onChange={() => toggle(idx)} aria-label={ing.display} />
              <span className="ingredient__amount">{ing.amount || '—'}</span>
              <span>
                <span className="ingredient__name">{ing.name}</span>
                {ing.note ? <span className="ingredient__note"> · {ing.note}</span> : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
