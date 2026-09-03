import type { Recipe } from '@/domain/recipe';
import { RecipeCard } from './RecipeCard';

interface RecipeGridProps {
  recipes: readonly Recipe[];
  compact?: boolean;
  ariaLabel?: string;
}

export function RecipeGrid({ recipes, compact = false, ariaLabel }: RecipeGridProps) {
  return (
    <ul className={['recipe-grid', compact ? 'recipe-grid--compact' : ''].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {recipes.map((r) => (
        <li key={r.id}>
          <RecipeCard recipe={r} />
        </li>
      ))}
    </ul>
  );
}
