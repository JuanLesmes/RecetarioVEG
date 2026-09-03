import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recipes } from '@/data';
import { countActiveFilters, searchRecipes, SORT_OPTIONS, type SortOption } from '@/domain/search';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUrlFilters } from '@/components/search/useUrlFilters';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 24;

export function ExplorePage() {
  useDocumentTitle('Explorar recetas');
  const { filters, page, update, setPage, reset } = useUrlFilters();
  const [params] = useSearchParams();
  const [queryInput, setQueryInput] = useState(filters.query);
  const debouncedQuery = useDebouncedValue(queryInput, 180);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const focusSearch = params.get('enfocar') === '1';

  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (debouncedQuery !== filters.query) update({ query: debouncedQuery }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // La hoja de filtros móvil bloquea el scroll del fondo mientras está abierta.
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen, isMobile]);

  const results = useMemo(() => searchRecipes(recipes, filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => r.recipe);
  const activeCount = countActiveFilters(filters);
  const sheetOpen = isMobile && filtersOpen;

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Catálogo</span>
        <h1>Explorar recetas</h1>
        <p>Combina búsqueda por texto con filtros de dieta, categoría, tiempo, cocina, dificultad e ingredientes.</p>
      </div>

      <div className="explore">
        {sheetOpen ? <div className="sheet-backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" /> : null}
        <aside
          className={['card', 'explore__sidebar', 'no-print', sheetOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
          hidden={isMobile && !filtersOpen}
          aria-label="Filtros"
          role={isMobile ? 'dialog' : undefined}
          aria-modal={isMobile ? true : undefined}
        >
          {isMobile ? (
            <div className="sheet__handle" aria-hidden="true">
              <span />
            </div>
          ) : null}
          <FilterPanel filters={filters} onChange={(patch) => update(patch)} onReset={reset} activeCount={activeCount} />
          {isMobile ? (
            <div className="sheet__footer">
              <Button variant="ghost" onClick={reset} disabled={activeCount === 0}>
                Limpiar
              </Button>
              <Button variant="primary" block onClick={() => setFiltersOpen(false)} data-testid="sheet-apply">
                Ver {results.length} {results.length === 1 ? 'receta' : 'recetas'}
              </Button>
            </div>
          ) : null}
        </aside>

        <section aria-label="Resultados">
          <div className="explore__toolbar">
            <SearchBar value={queryInput} onChange={setQueryInput} onSubmit={(v) => update({ query: v })} autoFocus={focusSearch} />
            <Button className="explore__filters-toggle" variant="secondary" icon="sliders" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              Filtros{activeCount ? ` (${activeCount})` : ''}
            </Button>
            <label className="field explore__sort">
              <span className="sr-only">Ordenar por</span>
              <select className="input" value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortOption })} aria-label="Ordenar por" data-testid="sort-select">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="explore__summary" data-testid="results-summary">
            <span>
              <strong>{results.length}</strong> {results.length === 1 ? 'receta' : 'recetas'}
              {filters.query ? (
                <>
                  {' '}
                  para <strong>“{filters.query}”</strong>
                </>
              ) : null}
            </span>
            <ActiveFilters filters={filters} onChange={(patch) => update(patch)} />
          </div>

          {pageItems.length > 0 ? (
            <RecipeGrid recipes={pageItems} ariaLabel="Resultados de búsqueda" />
          ) : (
            <EmptyState
              illustration="salad"
              title="No encontramos recetas con esos criterios"
              description="Prueba con otras palabras, quita algún filtro o explora por categoría."
              action={
                <Button variant="primary" icon="reset" onClick={reset}>
                  Limpiar búsqueda y filtros
                </Button>
              }
            />
          )}

          {totalPages > 1 ? (
            <nav className="pagination" aria-label="Paginación">
              <Button variant="secondary" icon="chevron-left" iconOnly disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                Página anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={p === currentPage ? 'primary' : 'ghost'} size="sm" onClick={() => setPage(p)} aria-current={p === currentPage ? 'page' : undefined}>
                  {p}
                </Button>
              ))}
              <Button variant="secondary" icon="chevron-right" iconOnly disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                Página siguiente
              </Button>
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
