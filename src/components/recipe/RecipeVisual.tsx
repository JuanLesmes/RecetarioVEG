import type { Category, Visual } from '@/domain/recipe';
import { DishIllustration } from '@/components/illustrations/DishIllustration';

interface RecipeVisualProps {
  visual: Visual;
  category: Category;
  hero?: boolean;
  label?: string;
}

/** Ilustración vectorial del plato sobre un degradado propio de su categoría. */
export function RecipeVisual({ visual, category, hero = false, label }: RecipeVisualProps) {
  return (
    <div
      className={['recipe-visual', hero ? 'recipe-visual--hero' : ''].filter(Boolean).join(' ')}
      style={{ background: `var(--cat-${category})` }}
      data-visual={visual}
    >
      <DishIllustration name={visual} title={label} className="recipe-visual__art" />
    </div>
  );
}
