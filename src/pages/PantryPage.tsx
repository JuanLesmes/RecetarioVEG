import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { recipes } from '@/data';
import { matchPantry, pantryVocabulary, STAPLES, suggestIngredients, type PantryMatch } from '@/domain/pantry';
import type { Diet } from '@/domain/recipe';
import { useApp } from '@/store/AppContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeCard } from '@/components/recipe/RecipeCard';

const vocabulary = pantryVocabulary(recipes);
const POPULAR = vocabulary.slice(0, 18).map((v) => v.name);

function MatchFooter({ match }: { match: PantryMatch }) {
  const pct = Math.round(match.coverage * 100);
  const complete = match.missing.length === 0;
  return (
    <div className="match" data-testid="match-footer">
      <div className="match__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Coincidencia de ingredientes">
        <div className="match__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="match__line">
        <strong className={complete ? 'match__ok' : ''}>
          {complete ? <Icon name="check" /> : null}
          {match.have.length}/{match.total} ingredientes
        </strong>
        <span className="muted">{pct}%</span>
      </div>
      {match.missing.length > 0 ? (
        <p className="match__missing">
          Te falta{match.missing.length === 1 ? '' : 'n'}: {match.missing.map((m) => m.name).join(', ')}
        </p>
      ) : (
        <p className="match__missing match__ok">¡Lo puedes hacer ya!</p>
      )}
    </div>
  );
}

export function PantryPage() {
  useDocumentTitle('Cocina con lo que tienes');
  const { pantry, addPantryItem, removePantryItem, clearPantry } = useApp();
  const [input, setInput] = useState('');
  const [ignoreStaples, setIgnoreStaples] = useState(true);
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [diet, setDiet] = useState<Diet | 'todas'>('todas');
  const [maxMissing, setMaxMissing] = useState<number | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const suggestions = useMemo(() => suggestIngredients(vocabulary, input, pantry), [input, pantry]);

  const matches = useMemo(
    () => matchPantry(recipes, pantry, { ignoreStaples, onlyComplete, diet, maxMissing }),
    [pantry, ignoreStaples, onlyComplete, diet, maxMissing],
  );

  const add = (value: string) => {
    for (const part of value.split(',')) addPantryItem(part);
    setInput('');
    setActiveSuggestion(-1);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (activeSuggestion >= 0 && suggestions[activeSuggestion]) add(suggestions[activeSuggestion]);
    else add(input);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setActiveSuggestion(-1);
    }
  };

  const readyNow = matches.filter((m) => m.missing.length === 0).length;

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Despensa</span>
        <h1>Cocina con lo que tienes</h1>
        <p>Agrega los ingredientes que hay en tu cocina y te mostramos qué recetas puedes hacer, de la más completa a la que más le falta.</p>
      </div>

      <div className="pantry">
        <section className="panel pantry__panel" aria-labelledby="mis-ingredientes">
          <div className="panel__head">
            <h2 id="mis-ingredientes" style={{ fontSize: '1.25rem' }}>
              Mis ingredientes {pantry.length ? `(${pantry.length})` : ''}
            </h2>
            {pantry.length ? (
              <Button variant="ghost" size="sm" icon="trash" onClick={clearPantry}>
                Vaciar
              </Button>
            ) : null}
          </div>

          <form className="pantry__form" onSubmit={submit}>
            <label className="sr-only" htmlFor="pantry-input">
              Agregar ingrediente
            </label>
            <div className="pantry__inputwrap">
              <input
                id="pantry-input"
                className="input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setActiveSuggestion(-1);
                }}
                onKeyDown={onKey}
                placeholder="ej. papa, cebolla larga, huevo"
                autoComplete="off"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls="pantry-suggestions"
                aria-autocomplete="list"
                data-testid="pantry-input"
              />
              {suggestions.length > 0 ? (
                <ul className="searchbar__suggestions" role="listbox" id="pantry-suggestions">
                  {suggestions.map((s, i) => (
                    <li key={s} role="option" aria-selected={i === activeSuggestion}>
                      <button
                        type="button"
                        className={['searchbar__suggestion', i === activeSuggestion ? 'is-active' : ''].filter(Boolean).join(' ')}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => add(s)}
                      >
                        <Icon name="plus" />
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button type="submit" variant="primary" icon="plus" iconOnly disabled={!input.trim()}>
              Agregar
            </Button>
          </form>

          {pantry.length > 0 ? (
            <ul className="pantry__chips" aria-label="Ingredientes en tu despensa" data-testid="pantry-chips">
              {pantry.map((p) => (
                <li key={p}>
                  <Chip selected onRemove={() => removePantryItem(p)} removeLabel="Quitar">
                    {p}
                  </Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ fontSize: '0.92rem' }}>
              Todavía no has agregado nada. Escribe arriba o toca uno de los ingredientes comunes.
            </p>
          )}

          <div className="filters__group">
            <div className="filters__title">Ingredientes comunes</div>
            <div className="filters__chips">
              {POPULAR.filter((p) => !pantry.includes(p)).slice(0, 12).map((p) => (
                <Chip key={p} onClick={() => addPantryItem(p)}>
                  + {p}
                </Chip>
              ))}
            </div>
          </div>

          <div className="filters__group">
            <div className="filters__title">Opciones</div>
            <label className="checkbox">
              <input type="checkbox" checked={ignoreStaples} onChange={(e) => setIgnoreStaples(e.target.checked)} />
              <span>
                No contar básicos <span className="muted">({STAPLES.join(', ')})</span>
              </span>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} data-testid="pantry-only-complete" />
              <span>Solo lo que puedo hacer ya</span>
            </label>
            <div className="segmented" role="group" aria-label="Dieta">
              {(['todas', 'vegana', 'vegetariana'] as const).map((d) => (
                <button key={d} type="button" className={['segmented__btn', diet === d ? 'is-active' : ''].join(' ')} aria-pressed={diet === d} onClick={() => setDiet(d)}>
                  {d === 'todas' ? 'Todas' : d === 'vegana' ? 'Vegana' : 'Vegetariana'}
                </button>
              ))}
            </div>
            <label className="field">
              <span className="field__label">Máximo de ingredientes que me falten: {maxMissing === null ? 'sin límite' : maxMissing}</span>
              <input
                type="range"
                className="range"
                min={0}
                max={6}
                value={maxMissing === null ? 6 : maxMissing}
                onChange={(e) => setMaxMissing(Number(e.target.value) >= 6 ? null : Number(e.target.value))}
                aria-label="Máximo de ingredientes faltantes"
              />
            </label>
          </div>
        </section>

        <section aria-label="Recetas que puedes hacer">
          {pantry.length === 0 ? (
            <EmptyState
              illustration="skillet"
              title="Cuéntanos qué tienes"
              description="Con dos o tres ingredientes ya encontramos ideas. Entre más agregues, más precisas serán las coincidencias."
            />
          ) : matches.length === 0 ? (
            <EmptyState
              illustration="salad"
              title="Sin coincidencias con esos filtros"
              description="Prueba quitando el límite de faltantes o agregando más ingredientes."
            />
          ) : (
            <>
              <div className="explore__summary" data-testid="pantry-summary">
                <span>
                  <strong>{matches.length}</strong> {matches.length === 1 ? 'receta' : 'recetas'} con tus ingredientes
                  {readyNow ? (
                    <>
                      {' '}
                      · <strong>{readyNow}</strong> {readyNow === 1 ? 'lista' : 'listas'} para hacer ya
                    </>
                  ) : null}
                </span>
              </div>
              <ul className="recipe-grid" aria-label="Coincidencias">
                {matches.slice(0, 60).map((m) => (
                  <li key={m.recipe.id}>
                    <RecipeCard recipe={m.recipe} footer={<MatchFooter match={m} />} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
