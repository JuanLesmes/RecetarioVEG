import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dailyPicks, getRecipesByIds, recipes, stats } from '@/data';
import { CATEGORIES, CATEGORY_LABELS, totalTime } from '@/domain/recipe';
import { useApp } from '@/store/AppContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SearchBar } from '@/components/search/SearchBar';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { HeroArt } from '@/components/illustrations/HeroArt';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';

const QUICK = [
  { label: 'En 30 min', icon: 'clock' as const, to: '/recetas?tmax=30' },
  { label: 'Solo veganas', icon: 'leaf' as const, to: '/recetas?dieta=vegana' },
  { label: 'Alto en proteína', icon: 'flame' as const, to: '/recetas?tag=alto+en+prote%C3%ADna' },
  { label: 'Sin gluten', icon: 'check' as const, to: '/recetas?tag=sin+gluten' },
  { label: 'Económicas', icon: 'sparkles' as const, to: '/recetas?tag=econ%C3%B3mico' },
  { label: 'Para niños', icon: 'users' as const, to: '/recetas?tag=para+ni%C3%B1os' },
];

const PANTRY_HINTS = ['arroz', 'papa', 'cebolla', 'tomate', 'garbanzos', 'aguacate', 'plátano', 'lentejas'];

export function HomePage() {
  useDocumentTitle();
  const navigate = useNavigate();
  const { recent, pantry, addPantryItem } = useApp();
  const [query, setQuery] = useState('');
  const [pantryInput, setPantryInput] = useState('');

  const picks = useMemo(() => dailyPicks(4), []);
  const quick = useMemo(
    () =>
      [...recipes]
        .filter((r) => totalTime(r) <= 30)
        .sort((a, b) => totalTime(a) - totalTime(b))
        .slice(0, 4),
    [],
  );
  const recentRecipes = useMemo(() => getRecipesByIds(recent).slice(0, 4), [recent]);
  const topCuisines = stats.cuisines.slice(0, 12);

  const submitPantry = (e: FormEvent) => {
    e.preventDefault();
    for (const part of pantryInput.split(',')) addPantryItem(part);
    navigate('/despensa');
  };

  return (
    <div>
      <section className="hero">
        <HeroArt className="hero__art" />
        <div className="hero__content">
          <span className="eyebrow">Recetario vegano y vegetariano</span>
          <h1 className="hero__title">
            Cocina <em>de plantas</em>, sin complicarte.
          </h1>
          <p className="hero__lead">
            {stats.total} recetas con ingredientes como los pides en la plaza, paso a paso y consejos. Filtra por tiempo, dieta o lo que tengas
            en la nevera, ajusta las porciones y arma tu lista de mercado en un toque.
          </p>
          <div className="hero__search">
            <SearchBar value={query} onChange={setQuery} large onSubmit={(v) => navigate(`/recetas?q=${encodeURIComponent(v)}`)} autoFocus={false} />
          </div>
          <div className="hero__quick" aria-label="Atajos">
            {QUICK.map((q) => (
              <Link key={q.to} to={q.to} className="chip chip--link">
                <Icon name={q.icon} /> {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section--tight section">
        <div className="pantry-cta">
          <div className="pantry-cta__text">
            <span className="eyebrow">¿Qué tengo en la nevera?</span>
            <h2>Dime qué tienes y te digo qué cocinar</h2>
            <p className="muted">Escribe tus ingredientes separados por coma y te mostramos las recetas que más se acercan, con lo que te faltaría.</p>
          </div>
          <form className="pantry-cta__form" onSubmit={submitPantry}>
            <label className="sr-only" htmlFor="pantry-home">
              Ingredientes que tienes
            </label>
            <input
              id="pantry-home"
              className="input"
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              placeholder={pantry.length ? `Ya tienes ${pantry.length} en tu despensa…` : 'ej. papa, cebolla, huevo'}
              autoComplete="off"
              data-testid="pantry-home-input"
            />
            <Button type="submit" variant="primary" icon="basket">
              {pantry.length ? 'Ver coincidencias' : 'Buscar'}
            </Button>
          </form>
          <div className="pantry-cta__hints">
            {PANTRY_HINTS.map((h) => (
              <Chip
                key={h}
                onClick={() => {
                  addPantryItem(h);
                  navigate('/despensa');
                }}
              >
                + {h}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="stats" aria-label="Resumen del catálogo">
          <div className="stat">
            <span className="stat__value">{stats.total}</span>
            <span className="stat__label">recetas en total</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.vegan}</span>
            <span className="stat__label">veganas</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.vegetarian}</span>
            <span className="stat__label">vegetarianas</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.cuisines.length}</span>
            <span className="stat__label">cocinas del mundo</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Explora</span>
            <h2>Por categoría</h2>
          </div>
          <Button to="/recetas" variant="secondary" icon="arrow-right">
            Ver todas
          </Button>
        </div>
        <div className="categories">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/recetas?cat=${c}`} className="category-tile" style={{ background: `var(--cat-${c})` }}>
              <span className="category-tile__icon">
                <CategoryIcon category={c} />
              </span>
              <span className="category-tile__name">{CATEGORY_LABELS[c]}</span>
              <span className="category-tile__count">{stats.byCategory[c] ?? 0} recetas</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Hoy</span>
            <h2>Recetas del día</h2>
            <p>Una selección distinta cada día para inspirarte.</p>
          </div>
        </div>
        <RecipeGrid recipes={picks} ariaLabel="Recetas del día" />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Rápidas</span>
            <h2>Listas en 30 minutos o menos</h2>
          </div>
          <Button to="/recetas?tmax=30" variant="secondary" icon="arrow-right">
            Ver todas las rápidas
          </Button>
        </div>
        <RecipeGrid recipes={quick} ariaLabel="Recetas rápidas" />
      </section>

      {recentRecipes.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Tu historial</span>
              <h2>Vistas recientemente</h2>
            </div>
          </div>
          <RecipeGrid recipes={recentRecipes} ariaLabel="Recetas vistas recientemente" />
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Viaja con el paladar</span>
            <h2>Cocinas del mundo</h2>
          </div>
        </div>
        <div className="filters__chips">
          {topCuisines.map((c) => (
            <Chip key={c.name} onClick={() => navigate(`/recetas?cocina=${encodeURIComponent(c.name)}`)} count={c.count}>
              {c.name}
            </Chip>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-grid">
          <div className="callout callout--cta">
            <div>
              <h3>Planifica tu semana</h3>
              <p className="muted">Asigna recetas a cada comida y genera la lista de mercado automáticamente.</p>
            </div>
            <Button to="/planificador" variant="primary" icon="calendar">
              Abrir planificador
            </Button>
          </div>
          <div className="callout callout--accent callout--cta">
            <div>
              <h3>Comparte tu receta</h3>
              <p className="muted">Súbela con el mismo formato del catálogo; el asistente te ayuda con porciones, etiquetas y nutrición.</p>
            </div>
            <div className="planner__actions">
              <Button to="/mis-recetas/nueva" variant="accent" icon="plus-circle">
                Subir receta
              </Button>
              <Button to="/comunidad" variant="secondary" icon="globe">
                Ver comunidad
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
