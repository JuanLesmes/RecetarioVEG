import { Link } from 'react-router-dom';
import { toRecipe } from '@/domain/userRecipe';
import { useApp } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';
import { useRecipes } from '@/store/RecipesContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { RecipeCard } from '@/components/recipe/RecipeCard';

export function MyRecipesPage() {
  useDocumentTitle('Mis recetas');
  const { mine, deleteRecipe, setStatus, syncing, cloudError } = useRecipes();
  const { user, cloudEnabled } = useAuth();
  const { notify } = useApp();

  const canPublish = !cloudEnabled || Boolean(user);

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    await deleteRecipe(id);
    notify('Receta eliminada');
  };

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Tu cocina</span>
        <h1>Mis recetas</h1>
        <p>
          Las recetas que creas siguen el mismo formato del catálogo. Se guardan en este dispositivo
          {cloudEnabled ? (user ? ' y en tu cuenta.' : '; inicia sesión para guardarlas en tu cuenta y publicarlas.') : '.'}
        </p>
      </div>

      <div className="planner__summary">
        <span className="muted" data-testid="my-recipes-count">
          <strong>{mine.length}</strong> {mine.length === 1 ? 'receta' : 'recetas'}
          {syncing ? ' · sincronizando…' : ''}
        </span>
        <div className="planner__actions">
          {cloudEnabled && !user ? (
            <Button to="/cuenta" variant="secondary" icon="log-in">
              Entrar
            </Button>
          ) : null}
          <Button to="/mis-recetas/nueva" variant="primary" icon="plus-circle" data-testid="new-recipe">
            Nueva receta
          </Button>
        </div>
      </div>

      {cloudError ? (
        <div className="callout callout--accent" role="alert">
          <h4 className="callout__title">
            <Icon name="cloud-off" /> No se pudo sincronizar
          </h4>
          <p>{cloudError}. Tus recetas siguen guardadas en este dispositivo.</p>
        </div>
      ) : null}

      {mine.length === 0 ? (
        <EmptyState
          illustration="skillet"
          title="Todavía no has subido recetas"
          description="Comparte esa preparación que te sale de maravilla. El asistente te ayuda con porciones, etiquetas y nutrición."
          action={
            <Button to="/mis-recetas/nueva" variant="primary" icon="plus-circle">
              Crear mi primera receta
            </Button>
          }
        />
      ) : (
        <ul className="recipe-grid" aria-label="Mis recetas">
          {mine.map((r) => (
            <li key={r.id}>
              <RecipeCard
                recipe={toRecipe(r)}
                footer={
                  <div className="owner-actions">
                    <span className={['badge', r.status === 'publicada' ? 'badge--vegana' : 'badge--neutral'].join(' ')}>
                      <Icon name={r.status === 'publicada' ? 'globe' : 'lock'} />
                      {r.status === 'publicada' ? 'Publicada' : 'Privada'}
                    </span>
                    <div className="owner-actions__buttons">
                      <Button size="sm" variant="secondary" icon="edit" to={`/mis-recetas/${r.id}/editar`}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={r.status === 'publicada' ? 'lock' : 'globe'}
                        onClick={() => setStatus(r.id, r.status === 'publicada' ? 'privada' : 'publicada').then(() => notify(r.status === 'publicada' ? 'Receta ahora privada' : 'Receta publicada en la comunidad'))}
                        disabled={!canPublish}
                        title={canPublish ? undefined : 'Inicia sesión para publicar'}
                      >
                        {r.status === 'publicada' ? 'Hacer privada' : 'Publicar'}
                      </Button>
                      <Button size="sm" variant="ghost" icon="trash" iconOnly onClick={() => remove(r.id, r.data.title)}>
                        Eliminar {r.data.title}
                      </Button>
                    </div>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: '1.5rem' }}>
        ¿Quieres ver lo que otros han compartido? <Link to="/comunidad">Ir a la comunidad</Link>.
      </p>
    </div>
  );
}
