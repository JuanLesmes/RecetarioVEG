import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isCategory,
  isCuisine,
  isDiet,
  isDifficulty,
  isTag,
  type Category,
  type Cuisine,
  type Difficulty,
  type Tag,
} from '@/domain/recipe';
import { EMPTY_FILTERS, type SearchFilters, type SortOption } from '@/domain/search';

const SORTS: SortOption[] = ['relevancia', 'rapidas', 'titulo', 'calorias', 'proteina'];

function list(value: string | null): string[] {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export function parseFilters(params: URLSearchParams): SearchFilters {
  const diet = params.get('dieta') ?? '';
  const maxTime = Number(params.get('tmax'));
  const sort = params.get('orden') ?? '';
  return {
    query: params.get('q') ?? '',
    diet: isDiet(diet) ? diet : 'todas',
    categories: list(params.get('cat')).filter(isCategory) as Category[],
    cuisines: list(params.get('cocina')).filter(isCuisine) as Cuisine[],
    difficulties: list(params.get('dif')).filter(isDifficulty) as Difficulty[],
    maxTime: Number.isFinite(maxTime) && maxTime > 0 ? maxTime : null,
    tags: list(params.get('tag')).filter(isTag) as Tag[],
    includeIngredients: list(params.get('con')),
    excludeIngredients: list(params.get('sin')),
    sort: SORTS.includes(sort as SortOption) ? (sort as SortOption) : 'relevancia',
  };
}

export function serializeFilters(filters: SearchFilters, page = 1): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.query) p.set('q', filters.query);
  if (filters.diet !== 'todas') p.set('dieta', filters.diet);
  if (filters.categories.length) p.set('cat', filters.categories.join(','));
  if (filters.cuisines.length) p.set('cocina', filters.cuisines.join(','));
  if (filters.difficulties.length) p.set('dif', filters.difficulties.join(','));
  if (filters.maxTime !== null) p.set('tmax', String(filters.maxTime));
  if (filters.tags.length) p.set('tag', filters.tags.join(','));
  if (filters.includeIngredients.length) p.set('con', filters.includeIngredients.join(','));
  if (filters.excludeIngredients.length) p.set('sin', filters.excludeIngredients.join(','));
  if (filters.sort !== 'relevancia') p.set('orden', filters.sort);
  if (page > 1) p.set('pagina', String(page));
  return p;
}

/** Sincroniza los filtros de búsqueda con la URL para que sean compartibles y navegables. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const page = Math.max(1, Number(params.get('pagina')) || 1);

  const update = useCallback(
    (patch: Partial<SearchFilters>, options: { replace?: boolean; resetPage?: boolean } = {}) => {
      const next = { ...parseFilters(params), ...patch };
      const nextPage = options.resetPage === false ? page : 1;
      setParams(serializeFilters(next, nextPage), { replace: options.replace ?? false });
    },
    [params, page, setParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      setParams(serializeFilters(parseFilters(params), nextPage));
    },
    [params, setParams],
  );

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  return { filters, page, update, setPage, reset, empty: EMPTY_FILTERS };
}
