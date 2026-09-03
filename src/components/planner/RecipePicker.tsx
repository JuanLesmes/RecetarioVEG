import { useMemo, useState } from 'react';
import { recipes } from '@/data';
import { CATEGORY_LABELS, formatMinutes, recipeVisual, totalTime, type Category, type Recipe } from '@/domain/recipe';
import { EMPTY_FILTERS, searchRecipes } from '@/domain/search';
import { Dialog } from '@/components/ui/Dialog';
import { SearchBar } from '@/components/search/SearchBar';
import { DietBadge } from '@/components/recipe/DietBadge';
import { Chip } from '@/components/ui/Chip';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

interface RecipePickerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (recipe: Recipe) => void;
  suggestedCategories?: Category[];
}

export function RecipePicker({ open, title, onClose, onPick, suggestedCategories = [] }: RecipePickerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(suggestedCategories[0] ?? null);

  const results = useMemo(
    () =>
      searchRecipes(recipes, {
        ...EMPTY_FILTERS,
        query,
        categories: category ? [category] : [],
      }).slice(0, 40),
    [query, category],
  );

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="stack" style={{ '--stack-gap': '0.9rem' } as React.CSSProperties}>
        <SearchBar value={query} onChange={setQuery} withSuggestions={false} placeholder="Buscar receta…" autoFocus />
        <div className="filters__chips filters__chips--scroll">
          <Chip selected={category === null} onClick={() => setCategory(null)}>
            Todas
          </Chip>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
        <ul className="picker" aria-label="Resultados">
          {results.map(({ recipe }) => (
            <li key={recipe.id}>
              <button type="button" className="picker__item" onClick={() => onPick(recipe)} data-testid="picker-result">
                <span className="thumb" style={{ background: `var(--cat-${recipe.category})` }}>
                  <DishIllustration name={recipeVisual(recipe)} />
                </span>
                <span className="picker__text">
                  <span className="picker__title">{recipe.title}</span>
                  <span className="picker__meta">
                    {CATEGORY_LABELS[recipe.category]} · {formatMinutes(totalTime(recipe))}
                  </span>
                </span>
                <DietBadge diet={recipe.diet} compact />
              </button>
            </li>
          ))}
          {results.length === 0 ? <li className="muted">Sin resultados.</li> : null}
        </ul>
      </div>
    </Dialog>
  );
}
