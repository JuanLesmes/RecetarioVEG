import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { randomRecipe } from '@/data';
import { countPlannedMeals } from '@/domain/planner';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SearchBar } from '@/components/search/SearchBar';

const LINKS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/recetas', label: 'Recetas', icon: 'compass' },
  { to: '/despensa', label: 'Despensa', icon: 'basket' },
  { to: '/favoritos', label: 'Favoritos', icon: 'heart' },
  { to: '/lista-de-compras', label: 'Compras', icon: 'cart' },
  { to: '/planificador', label: 'Plan', icon: 'calendar' },
];

/** En móvil la barra inferior muestra 5 destinos; favoritos pasa a la cabecera. */
const MOBILE_LINKS = LINKS.filter((l) => l.to !== '/favoritos');

export function Header() {
  const { favorites, shopping, plan, pantry, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const counts: Record<string, number> = {
    '/favoritos': favorites.length,
    '/lista-de-compras': shopping.filter((i) => !i.checked).length,
    '/planificador': countPlannedMeals(plan),
    '/despensa': pantry.length,
  };

  const surprise = () => {
    const r = randomRecipe();
    if (r) navigate(`/receta/${r.id}`);
  };

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="header no-print">
        <div className="container header__inner">
          <Link to="/" className="brand" aria-label="Recetario VEG, inicio">
            <span className="brand__logo" aria-hidden="true">
              <Icon name="leaf" />
            </span>
            <span className="brand__name">
              Recetario<em>VEG</em>
            </span>
          </Link>
          <nav className="nav" aria-label="Principal">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => ['nav__link', isActive ? 'is-active' : ''].join(' ')}>
                {l.label}
                {counts[l.to] ? <span className="nav__count">{counts[l.to]}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="header__search">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={(v) => {
                navigate(`/recetas?q=${encodeURIComponent(v)}`);
                setQuery('');
              }}
              placeholder="Buscar…"
              ariaLabel="Buscar recetas desde la cabecera"
            />
          </div>
          <div className="header__actions">
            <Button className="header__mobile-only" variant="ghost" icon="search" iconOnly to="/recetas?enfocar=1" title="Buscar">
              Buscar recetas
            </Button>
            <Button className="header__mobile-only" variant="ghost" icon="heart" iconOnly to="/favoritos" title="Favoritos" iconFilled={favorites.length > 0}>
              Favoritos
            </Button>
            <Button variant="ghost" icon="shuffle" iconOnly onClick={surprise} title="Sorpréndeme con una receta">
              Receta al azar
            </Button>
            <Button variant="ghost" icon={theme === 'dark' ? 'sun' : 'moon'} iconOnly onClick={toggleTheme} title="Cambiar tema" data-testid="theme-toggle">
              {theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            </Button>
          </div>
        </div>
      </header>
      <nav className="mobile-nav no-print" aria-label="Principal (móvil)">
        {MOBILE_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => ['mobile-nav__link', isActive ? 'is-active' : ''].join(' ')}>
            <Icon name={l.icon} />
            {l.label}
            {counts[l.to] ? <span className="nav__count">{counts[l.to]}</span> : null}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
