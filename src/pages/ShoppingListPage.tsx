import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { mergeItems, toPlainText } from '@/domain/shopping';
import { useApp } from '@/store/AppContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type View = 'combinada' | 'por-receta';

export function ShoppingListPage() {
  useDocumentTitle('Lista de mercado');
  const { shopping, toggleShoppingItems, removeShoppingItems, clearCheckedShopping, clearShopping, addShoppingItem, notify } = useApp();
  const [view, setView] = useState<View>('combinada');
  const [manual, setManual] = useState('');

  const merged = useMemo(() => mergeItems(shopping), [shopping]);
  const byRecipe = useMemo(() => {
    const groups = new Map<string, { title: string; id: string; items: typeof shopping }>();
    for (const item of shopping) {
      const g = groups.get(item.recipeId) ?? { title: item.recipeTitle, id: item.recipeId, items: [] };
      g.items.push(item);
      groups.set(item.recipeId, g);
    }
    return [...groups.values()];
  }, [shopping]);

  const pending = shopping.filter((i) => !i.checked).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(merged));
      notify('Lista copiada al portapapeles');
    } catch {
      notify('No se pudo copiar la lista');
    }
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    addShoppingItem(manual);
    setManual('');
  };

  const confirmClear = () => {
    if (window.confirm('¿Vaciar toda la lista de mercado?')) {
      clearShopping();
      notify('Lista vaciada');
    }
  };

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Al mercado</span>
        <h1>Lista de mercado</h1>
        <p>Se combinan los ingredientes repetidos de distintas recetas y se suman las cantidades cuando comparten unidad.</p>
      </div>

      <div className="shopping">
        <section aria-label="Ítems" className="shopping__main">
          <form className="tag-input shopping__add no-print" onSubmit={submitManual}>
            <input className="input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Agregar ítem, ej. papel parafinado" aria-label="Nuevo ítem" />
            <Button type="submit" variant="primary" icon="plus" iconOnly disabled={!manual.trim()}>
              Agregar
            </Button>
          </form>

          <div className="explore__toolbar">
            <div className="segmented" role="group" aria-label="Vista">
              <button type="button" className={['segmented__btn', view === 'combinada' ? 'is-active' : ''].join(' ')} onClick={() => setView('combinada')} aria-pressed={view === 'combinada'}>
                Combinada
              </button>
              <button type="button" className={['segmented__btn', view === 'por-receta' ? 'is-active' : ''].join(' ')} onClick={() => setView('por-receta')} aria-pressed={view === 'por-receta'}>
                Por receta
              </button>
            </div>
            <span className="muted" data-testid="shopping-pending">
              {pending} pendiente{pending === 1 ? '' : 's'} de {shopping.length}
            </span>
          </div>

          {shopping.length === 0 ? (
            <EmptyState
              illustration="snack"
              title="Tu lista está vacía"
              description="Abre una receta y toca “Agregar a la lista” para traer sus ingredientes."
              action={
                <Button to="/recetas" variant="primary" icon="compass">
                  Buscar recetas
                </Button>
              }
            />
          ) : view === 'combinada' ? (
            <ul className="shopping__list" data-testid="shopping-list">
              {merged.map((m) => (
                <li key={m.key} className={['shopping__item', m.checked ? 'is-checked' : ''].join(' ')}>
                  <input type="checkbox" checked={m.checked} onChange={() => toggleShoppingItems(m.itemIds, !m.checked)} aria-label={m.display} />
                  <span className="shopping__name">
                    {m.display}
                    <span className="shopping__from">{m.recipes.join(' · ')}</span>
                  </span>
                  <Button variant="ghost" icon="trash" iconOnly size="sm" onClick={() => removeShoppingItems(m.itemIds)}>
                    Quitar {m.name}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="stack" style={{ '--stack-gap': '1.25rem' } as React.CSSProperties}>
              {byRecipe.map((g) => (
                <section key={g.id} aria-labelledby={`grupo-${g.id}`}>
                  <div className="section-head" style={{ marginBottom: '0.6rem' }}>
                    <h3 id={`grupo-${g.id}`}>{g.id === 'manual' ? g.title : <Link to={`/receta/${g.id}`}>{g.title}</Link>}</h3>
                    <Button variant="ghost" size="sm" icon="trash" onClick={() => removeShoppingItems(g.items.map((i) => i.id))}>
                      Quitar receta
                    </Button>
                  </div>
                  <ul className="shopping__list">
                    {mergeItems(g.items).map((m) => (
                      <li key={m.key} className={['shopping__item', m.checked ? 'is-checked' : ''].join(' ')}>
                        <input type="checkbox" checked={m.checked} onChange={() => toggleShoppingItems(m.itemIds, !m.checked)} aria-label={m.display} />
                        <span className="shopping__name">{m.display}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <aside className="panel no-print shopping__aside" aria-label="Acciones">
          <h3 className="panel__title">Acciones</h3>
          <div className="shopping__actions">
            <Button variant="secondary" icon="copy" block onClick={copy} disabled={shopping.length === 0}>
              Copiar como texto
            </Button>
            <Button variant="secondary" icon="printer" block onClick={() => window.print()} disabled={shopping.length === 0}>
              Imprimir
            </Button>
            <Button variant="secondary" icon="check" block onClick={clearCheckedShopping} disabled={shopping.every((i) => !i.checked)}>
              Quitar marcados
            </Button>
            <Button variant="danger" icon="trash" block onClick={confirmClear} disabled={shopping.length === 0}>
              Vaciar lista
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
