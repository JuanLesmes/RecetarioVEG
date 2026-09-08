import { useMemo } from 'react';
import type { Recipe } from '@/domain/recipe';
import { useApp } from '@/store/AppContext';
import { useRecipes } from '@/store/RecipesContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function FavoritesPage() {
  useDocumentTitle('Favoritos');
  const { favorites } = useApp();
  const { byId } = useRecipes();
  const list = useMemo(() => favorites.map((id) => byId(id)).filter((r): r is Recipe => r !== undefined), [favorites, byId]);

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Tu colección</span>
        <h1>Favoritos</h1>
        <p>Las recetas que guardas se quedan en este dispositivo y, si inicias sesión, también en tu cuenta.</p>
      </div>
      {list.length > 0 ? (
        <RecipeGrid recipes={list} ariaLabel="Recetas favoritas" />
      ) : (
        <EmptyState
          illustration="salad"
          title="Aún no tienes favoritos"
          description="Toca el corazón de cualquier receta para guardarla aquí."
          action={
            <Button to="/recetas" variant="primary" icon="compass">
              Explorar recetas
            </Button>
          }
        />
      )}
    </div>
  );
}
