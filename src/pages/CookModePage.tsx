import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipes } from '@/store/RecipesContext';
import { scaleIngredients } from '@/domain/scaling';
import { extractMinutes } from '@/domain/text';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { StepTimer } from '@/components/recipe/StepTimer';
import { NotFoundPage } from './NotFoundPage';

type WakeLockSentinelLike = { release: () => Promise<void> };

/** Mantiene la pantalla encendida mientras se cocina (cuando el navegador lo soporta). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };
    const request = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === 'visible') {
          sentinel = await nav.wakeLock.request('screen');
          if (cancelled) await sentinel.release();
        }
      } catch {
        /* sin soporte o denegado; se ignora */
      }
    };
    void request();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}

export function CookModePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { byId } = useRecipes();
  const recipe = byId(id);
  const [index, setIndex] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);

  useDocumentTitle(recipe ? `Cocinando: ${recipe.title}` : undefined);
  useWakeLock(Boolean(recipe));

  const steps = useMemo(() => recipe?.steps ?? [], [recipe]);
  const total = steps.length;
  const ingredients = useMemo(() => (recipe ? scaleIngredients(recipe.ingredients, recipe.servings, recipe.servings) : []), [recipe]);
  const minutesOptions = useMemo(() => (steps[index] ? extractMinutes(steps[index]) : []), [steps, index]);

  const goto = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(total - 1, next)));
      setTimerMinutes(null);
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goto(index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goto(index - 1);
      } else if (e.key === 'Escape') {
        navigate(`/receta/${id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, goto, navigate, id]);

  if (!recipe) return <NotFoundPage message="No encontramos esa receta." />;

  const progress = Math.round(((index + 1) / total) * 100);
  const isLast = index === total - 1;

  return (
    <div className="cook" data-testid="cook-mode">
      <div className="cook__top">
        <Button variant="ghost" icon="arrow-left" onClick={() => navigate(`/receta/${recipe.id}`)}>
          Salir
        </Button>
        <span className="cook__title" aria-live="polite">
          {recipe.title}
        </span>
        <span className="muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          Paso {index + 1} de {total}
        </span>
      </div>

      <div className="cook__main">
        <div className="stack" style={{ width: '100%', display: 'grid', justifyItems: 'center', '--stack-gap': '1.5rem' } as React.CSSProperties}>
          <div className="cook__step" key={index}>
            <span className="cook__step-num">Paso {index + 1}</span>
            <p className="cook__step-text" data-testid="cook-step-text">
              {steps[index]}
            </p>
            {minutesOptions.length > 0 ? (
              <div className="cook__timers">
                {timerMinutes ? (
                  <StepTimer key={`${index}-${timerMinutes}`} minutes={timerMinutes} />
                ) : (
                  minutesOptions.map((m) => (
                    <Button key={m} variant="secondary" icon="timer" onClick={() => setTimerMinutes(m)}>
                      Temporizador {m} min
                    </Button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <details className="cook__ingredients">
            <summary>Ver ingredientes ({ingredients.length})</summary>
            <ul>
              {ingredients.map((i, idx) => (
                <li key={idx}>{i.display}</li>
              ))}
            </ul>
          </details>
          <p className="muted cook__hint">
            Usa <span className="kbd">←</span> <span className="kbd">→</span> o <span className="kbd">Espacio</span> para navegar. <span className="kbd">Esc</span> para salir.
          </p>
        </div>
      </div>

      <div className="cook__bottom">
        <Button variant="secondary" icon="chevron-left" onClick={() => goto(index - 1)} disabled={index === 0} data-testid="cook-prev">
          Anterior
        </Button>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progreso">
          <div className="progress__bar" style={{ width: `${progress}%` }} />
        </div>
        {isLast ? (
          <Button variant="primary" icon="check" onClick={() => navigate(`/receta/${recipe.id}`)} data-testid="cook-finish">
            ¡Terminé!
          </Button>
        ) : (
          <Button variant="primary" icon="chevron-right" onClick={() => goto(index + 1)} data-testid="cook-next">
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
