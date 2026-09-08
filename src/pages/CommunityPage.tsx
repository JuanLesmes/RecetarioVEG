import { useMemo, useState } from 'react';
import { toRecipe } from '@/domain/userRecipe';
import { EMPTY_FILTERS, searchRecipes } from '@/domain/search';
import { useAuth } from '@/store/AuthContext';
import { useRecipes } from '@/store/RecipesContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { SearchBar } from '@/components/search/SearchBar';

export function CommunityPage() {
  useDocumentTitle('Comunidad');
  const { community, mine, refreshCommunity, cloudError } = useRecipes();
  const { cloudEnabled, user } = useAuth();
  const [query, setQuery] = useState('');

  const published = useMemo(() => [...mine.filter((r) => r.status === 'publicada'), ...community], [mine, community]);
  const results = useMemo(() => {
    const list = published.map(toRecipe);
    const ranked = searchRecipes(list, { ...EMPTY_FILTERS, query });
    const byId = new Map(published.map((r) => [r.id, r]));
    return ranked.map((r) => byId.get(r.recipe.id)!).filter(Boolean);
  }, [published, query]);

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Comunidad</span>
        <h1>Recetas de la gente</h1>
        <p>Preparaciones compartidas por otras personas, con el mismo formato del catálogo: ingredientes con cantidades, pasos y nutrición.</p>
      </div>

      {!cloudEnabled ? (
        <div className="callout callout--info">
          <h4 className="callout__title">
            <Icon name="cloud-off" /> Modo local
          </h4>
          <p>La comunidad necesita un servidor (Supabase) para compartir recetas entre personas. En este modo solo ves tus propias recetas publicadas.</p>
        </div>
      ) : null}
      {cloudEnabled && cloudError ? (
        <div className="callout callout--accent" role="alert" data-testid="community-error">
          <h4 className="callout__title">
            <Icon name="alert" /> No se pudo cargar la comunidad
          </h4>
          <p>{cloudError}</p>
        </div>
      ) : null}

      <div className="explore__toolbar">
        <SearchBar value={query} onChange={setQuery} withSuggestions={false} placeholder="Buscar en la comunidad…" />
        <Button variant="secondary" icon="reset" onClick={() => void refreshCommunity()} disabled={!cloudEnabled}>
          Actualizar
        </Button>
        <Button variant="primary" icon="plus-circle" to="/mis-recetas/nueva">
          Subir receta
        </Button>
      </div>

      <div className="explore__summary" data-testid="community-summary">
        <span>
          <strong>{results.length}</strong> {results.length === 1 ? 'receta' : 'recetas'} publicadas
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          illustration="dumplings"
          title={cloudEnabled ? 'Aún no hay recetas publicadas' : 'Nada publicado todavía'}
          description={user || !cloudEnabled ? 'Sé la primera persona en compartir una receta.' : 'Inicia sesión y comparte la tuya.'}
          action={
            <Button to="/mis-recetas/nueva" variant="primary" icon="plus-circle">
              Subir mi receta
            </Button>
          }
        />
      ) : (
        <ul className="recipe-grid" aria-label="Recetas de la comunidad">
          {results.map((r) => (
            <li key={r.id}>
              <RecipeCard
                recipe={toRecipe(r)}
                footer={
                  <span className="muted author-line">
                    <Icon name="user" /> {r.authorId === user?.id ? 'Tú' : r.authorName || 'Anónimo'}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
