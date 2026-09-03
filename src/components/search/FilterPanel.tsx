import { useState, type FormEvent } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  TAGS,
  type Category,
  type Cuisine,
  type Difficulty,
  type Tag,
} from '@/domain/recipe';
import type { SearchFilters } from '@/domain/search';
import { stats } from '@/data';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
  activeCount: number;
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

const TIME_OPTIONS = [15, 30, 45, 60, 90];

export function FilterPanel({ filters, onChange, onReset, activeCount }: FilterPanelProps) {
  const [ingredientInput, setIngredientInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const cuisines = showAllCuisines ? stats.cuisines : stats.cuisines.slice(0, 10);

  const addIngredient = (e: FormEvent) => {
    e.preventDefault();
    const v = ingredientInput.trim().toLowerCase();
    if (!v || filters.includeIngredients.includes(v)) return;
    onChange({ includeIngredients: [...filters.includeIngredients, v] });
    setIngredientInput('');
  };
  const addExclude = (e: FormEvent) => {
    e.preventDefault();
    const v = excludeInput.trim().toLowerCase();
    if (!v || filters.excludeIngredients.includes(v)) return;
    onChange({ excludeIngredients: [...filters.excludeIngredients, v] });
    setExcludeInput('');
  };

  return (
    <div className="filters" data-testid="filter-panel">
      <div className="filters__title filters__title--main">
        <span>Filtros{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" icon="reset" onClick={onReset}>
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="filters__group">
        <div className="filters__title">Dieta</div>
        <div className="segmented" role="group" aria-label="Dieta">
          {(['todas', 'vegana', 'vegetariana'] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={['segmented__btn', filters.diet === d ? 'is-active' : ''].filter(Boolean).join(' ')}
              aria-pressed={filters.diet === d}
              onClick={() => onChange({ diet: d })}
            >
              {d === 'vegana' ? <Icon name="leaf" /> : d === 'vegetariana' ? <Icon name="egg" /> : null}
              {d === 'todas' ? 'Todas' : d === 'vegana' ? 'Vegana' : 'Vegetariana'}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <div className="filters__title">Categoría</div>
        <div className="filters__chips">
          {CATEGORIES.map((c: Category) => (
            <Chip key={c} selected={filters.categories.includes(c)} onClick={() => onChange({ categories: toggleIn(filters.categories, c) })}>
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <div className="filters__title">Tiempo total máximo</div>
        <div className="filters__chips">
          {TIME_OPTIONS.map((t) => (
            <Chip key={t} selected={filters.maxTime === t} onClick={() => onChange({ maxTime: filters.maxTime === t ? null : t })}>
              ≤ {t} min
            </Chip>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <div className="filters__title">Dificultad</div>
        <div className="filters__chips">
          {DIFFICULTIES.map((d: Difficulty) => (
            <Chip key={d} selected={filters.difficulties.includes(d)} onClick={() => onChange({ difficulties: toggleIn(filters.difficulties, d) })}>
              {DIFFICULTY_LABELS[d]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <div className="filters__title">Cocina</div>
        <div className="filters__list">
          {cuisines.map((c) => (
            <label key={c.name} className="checkbox">
              <input
                type="checkbox"
                checked={filters.cuisines.includes(c.name)}
                onChange={() => onChange({ cuisines: toggleIn<Cuisine>(filters.cuisines, c.name) })}
              />
              <span>{c.name}</span>
              <span className="filters__count">{c.count}</span>
            </label>
          ))}
        </div>
        {stats.cuisines.length > 10 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAllCuisines((s) => !s)}>
            {showAllCuisines ? 'Ver menos' : `Ver todas (${stats.cuisines.length})`}
          </Button>
        ) : null}
      </div>

      <div className="filters__group">
        <div className="filters__title">Con ingrediente</div>
        <form className="tag-input" onSubmit={addIngredient}>
          <input
            className="input"
            placeholder="ej. garbanzos"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            aria-label="Incluir ingrediente"
          />
          <Button type="submit" variant="secondary" icon="plus" iconOnly>
            Agregar ingrediente
          </Button>
        </form>
        {filters.includeIngredients.length ? (
          <div className="filters__chips">
            {filters.includeIngredients.map((i) => (
              <Chip key={i} selected onRemove={() => onChange({ includeIngredients: filters.includeIngredients.filter((x) => x !== i) })}>
                {i}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="filters__group">
        <div className="filters__title">Sin ingrediente</div>
        <form className="tag-input" onSubmit={addExclude}>
          <input
            className="input"
            placeholder="ej. cebolla"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            aria-label="Excluir ingrediente"
          />
          <Button type="submit" variant="secondary" icon="plus" iconOnly>
            Agregar exclusión
          </Button>
        </form>
        {filters.excludeIngredients.length ? (
          <div className="filters__chips">
            {filters.excludeIngredients.map((i) => (
              <Chip key={i} selected accent onRemove={() => onChange({ excludeIngredients: filters.excludeIngredients.filter((x) => x !== i) })}>
                sin {i}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="filters__group">
        <div className="filters__title">Etiquetas</div>
        <div className="filters__chips">
          {TAGS.map((t: Tag) => (
            <Chip key={t} selected={filters.tags.includes(t)} onClick={() => onChange({ tags: toggleIn(filters.tags, t) })}>
              {t}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
