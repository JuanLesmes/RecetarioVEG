import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, formatMinutes, recipeVisual, totalTime, type Recipe } from '@/domain/recipe';
import { useApp } from '@/store/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DietBadge } from './DietBadge';
import { RecipeVisual } from './RecipeVisual';

interface RecipeCardProps {
  recipe: Recipe;
  /** Contenido extra bajo la descripción (p. ej. coincidencia de despensa). */
  footer?: ReactNode;
}

export const RecipeCard = memo(function RecipeCard({ recipe, footer }: RecipeCardProps) {
  const { isFavorite, toggleFavorite, notify } = useApp();
  const fav = isFavorite(recipe.id);

  const handleFav = () => {
    toggleFavorite(recipe.id);
    notify(fav ? 'Quitada de favoritos' : 'Guardada en favoritos');
  };

  return (
    <article className="recipe-card" data-testid="recipe-card" data-recipe-id={recipe.id}>
      <div className="recipe-card__visual">
        <RecipeVisual visual={recipeVisual(recipe)} category={recipe.category} />
        <div className="recipe-card__diet">
          <DietBadge diet={recipe.diet} />
        </div>
        <button
          type="button"
          className={['btn btn--icon recipe-card__fav', fav ? 'is-active' : ''].join(' ')}
          onClick={handleFav}
          aria-pressed={fav}
          aria-label={fav ? `Quitar ${recipe.title} de favoritos` : `Guardar ${recipe.title} en favoritos`}
        >
          <Icon name="heart" filled={fav} />
        </button>
      </div>
      <div className="recipe-card__body">
        <span className="recipe-card__category">
          {CATEGORY_LABELS[recipe.category]} · {recipe.cuisine}
        </span>
        <h3 className="recipe-card__title">
          <Link to={`/receta/${recipe.id}`} className="recipe-card__link">
            {recipe.title}
          </Link>
        </h3>
        <p className="recipe-card__desc">{recipe.description}</p>
        {footer ? <div className="recipe-card__footer">{footer}</div> : null}
        <div className="recipe-card__meta">
          <span className="meta">
            <Icon name="clock" /> {formatMinutes(totalTime(recipe))}
          </span>
          <span className="meta">
            <Icon name="gauge" /> {DIFFICULTY_LABELS[recipe.difficulty]}
          </span>
          <span className="meta">
            <Icon name="users" /> {recipe.servings}
          </span>
        </div>
      </div>
    </article>
  );
});
