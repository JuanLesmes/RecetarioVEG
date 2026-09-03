import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRecipeById, recipes } from '@/data';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, formatMinutes, recipeVisual, totalTime } from '@/domain/recipe';
import { scaleIngredients } from '@/domain/scaling';
import { relatedRecipes } from '@/domain/search';
import { useApp } from '@/store/AppContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DietBadge } from '@/components/recipe/DietBadge';
import { RecipeVisual } from '@/components/recipe/RecipeVisual';
import { ServingsControl } from '@/components/recipe/ServingsControl';
import { IngredientList } from '@/components/recipe/IngredientList';
import { StepList } from '@/components/recipe/StepList';
import { NutritionPanel } from '@/components/recipe/NutritionPanel';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { NotFoundPage } from './NotFoundPage';

export function RecipePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const recipe = getRecipeById(id);
  const { isFavorite, toggleFavorite, addRecipeToShopping, notify, markViewed } = useApp();
  const [servings, setServings] = useState(recipe?.servings ?? 4);

  useDocumentTitle(recipe?.title);

  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings);
      markViewed(recipe.id);
    }
  }, [recipe, markViewed]);

  const scaled = useMemo(() => (recipe ? scaleIngredients(recipe.ingredients, recipe.servings, servings) : []), [recipe, servings]);
  const related = useMemo(() => (recipe ? relatedRecipes(recipes, recipe, 4) : []), [recipe]);

  if (!recipe) return <NotFoundPage message="No encontramos esa receta." />;

  const fav = isFavorite(recipe.id);

  const share = async () => {
    const url = window.location.href;
    const data = { title: recipe.title, text: recipe.description, url };
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Enlace copiado al portapapeles');
    } catch {
      notify('No se pudo compartir en este navegador');
    }
  };

  const toggleFav = () => {
    toggleFavorite(recipe.id);
    notify(fav ? 'Quitada de favoritos' : 'Guardada en favoritos');
  };

  const addToList = () => {
    addRecipeToShopping(recipe, servings);
    notify(`Ingredientes de “${recipe.title}” agregados a tu lista`, { label: 'Ver lista', onAction: () => navigate('/lista-de-compras') });
  };

  return (
    <article data-testid="recipe-page" className="recipe">
      <nav className="breadcrumb no-print" aria-label="Migas de pan">
        <Link to="/">Inicio</Link>
        <span aria-hidden="true">›</span>
        <Link to="/recetas">Recetas</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/recetas?cat=${recipe.category}`}>{CATEGORY_LABELS[recipe.category]}</Link>
        <span aria-hidden="true" className="breadcrumb__last">
          ›
        </span>
        <span aria-current="page" className="breadcrumb__last">
          {recipe.title}
        </span>
      </nav>

      <header className="recipe-hero">
        <div className="recipe-hero__visual">
          <RecipeVisual visual={recipeVisual(recipe)} category={recipe.category} hero label={`Ilustración de ${recipe.title}`} />
        </div>
        <div className="recipe-hero__content">
          <div className="meta-row">
            <DietBadge diet={recipe.diet} />
            <span className="badge badge--neutral">{recipe.cuisine}</span>
            <span className="badge badge--neutral">{CATEGORY_LABELS[recipe.category]}</span>
          </div>
          <h1 className="recipe-hero__title">{recipe.title}</h1>
          <p className="recipe-hero__desc">{recipe.description}</p>
          <dl className="facts">
            <div className="fact">
              <dt>
                <Icon name="clock" /> Preparación
              </dt>
              <dd>{formatMinutes(recipe.prepTimeMinutes)}</dd>
            </div>
            <div className="fact">
              <dt>
                <Icon name="flame" /> Cocción
              </dt>
              <dd>{formatMinutes(recipe.cookTimeMinutes)}</dd>
            </div>
            <div className="fact">
              <dt>
                <Icon name="timer" /> Total
              </dt>
              <dd>{formatMinutes(totalTime(recipe))}</dd>
            </div>
            <div className="fact">
              <dt>
                <Icon name="gauge" /> Dificultad
              </dt>
              <dd>{DIFFICULTY_LABELS[recipe.difficulty]}</dd>
            </div>
            <div className="fact">
              <dt>
                <Icon name="users" /> Porciones
              </dt>
              <dd>{recipe.servings}</dd>
            </div>
          </dl>
          <div className="recipe-hero__tags">
            {recipe.tags.map((t) => (
              <Link key={t} to={`/recetas?tag=${encodeURIComponent(t)}`} className="chip chip--link">
                #{t}
              </Link>
            ))}
          </div>
          <div className="recipe-hero__actions no-print">
            <Button to={`/receta/${recipe.id}/cocinar`} variant="primary" icon="chef-hat" data-testid="cook-mode-link">
              Modo cocina
            </Button>
            <Button variant={fav ? 'accent' : 'secondary'} icon="heart" iconFilled={fav} onClick={toggleFav} aria-pressed={fav} data-testid="favorite-button">
              {fav ? 'En favoritos' : 'Guardar'}
            </Button>
            <Button variant="secondary" icon="cart" onClick={addToList} data-testid="add-to-shopping">
              Agregar a la lista
            </Button>
            <Button variant="ghost" icon="share" onClick={share}>
              Compartir
            </Button>
            <Button variant="ghost" icon="printer" onClick={() => window.print()}>
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      <div className="recipe-body">
        <aside className="recipe-body__aside">
          <section className="panel" aria-labelledby="ingredientes">
            <div className="panel__head">
              <h2 id="ingredientes" className="panel__title">
                Ingredientes
              </h2>
              <ServingsControl value={servings} original={recipe.servings} onChange={setServings} />
            </div>
            <IngredientList ingredients={scaled} />
            <Button variant="secondary" icon="cart" block onClick={addToList} className="no-print">
              Agregar todo a la lista de mercado
            </Button>
          </section>
          <section className="panel" aria-labelledby="nutricion">
            <h2 id="nutricion" className="panel__title">
              Nutrición por porción
            </h2>
            <NutritionPanel nutrition={recipe.nutrition} />
          </section>
        </aside>

        <div className="recipe-body__main">
          <section aria-labelledby="preparacion">
            <div className="section-head">
              <h2 id="preparacion">Preparación</h2>
              <span className="muted">{recipe.steps.length} pasos · toca un paso para marcarlo</span>
            </div>
            <StepList steps={recipe.steps} />
          </section>

          {recipe.veganAlternative ? (
            <section className="callout" aria-labelledby="veganizar">
              <h4 id="veganizar" className="callout__title">
                <Icon name="leaf" /> Versión vegana
              </h4>
              <p>{recipe.veganAlternative}</p>
            </section>
          ) : null}

          <section aria-labelledby="consejos">
            <div className="section-head">
              <h2 id="consejos">Consejos</h2>
            </div>
            <ul className="tips">
              {recipe.tips.map((tip, i) => (
                <li key={i} className="tip">
                  <Icon name="lightbulb" className="tip__icon" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="fuentes" className="panel">
            <h2 id="fuentes" className="panel__title">
              Referencias consultadas
            </h2>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Esta receta fue redactada de forma original a partir de la investigación en estas páginas.
            </p>
            <ul className="sources">
              {recipe.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="external" /> {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="section no-print" aria-labelledby="relacionadas">
          <div className="section-head">
            <div>
              <span className="eyebrow">Te puede gustar</span>
              <h2 id="relacionadas">Recetas relacionadas</h2>
            </div>
          </div>
          <RecipeGrid recipes={related} compact ariaLabel="Recetas relacionadas" />
        </section>
      ) : null}

      <div className="action-bar no-print" aria-label="Acciones rápidas">
        <Button variant={fav ? 'accent' : 'secondary'} icon="heart" iconFilled={fav} iconOnly onClick={toggleFav} aria-pressed={fav} data-testid="action-fav">
          {fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        </Button>
        <Button variant="secondary" icon="cart" iconOnly onClick={addToList} data-testid="action-cart">
          Agregar a la lista
        </Button>
        <Button variant="secondary" icon="share" iconOnly onClick={share}>
          Compartir
        </Button>
        <Button to={`/receta/${recipe.id}/cocinar`} variant="primary" icon="chef-hat" block data-testid="action-cook">
          Modo cocina
        </Button>
      </div>
    </article>
  );
}
