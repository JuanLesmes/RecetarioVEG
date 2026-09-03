import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { recipes, stats } from '@/data';
import { renderWithProviders } from '@/test/render';
import { ExplorePage } from './ExplorePage';

describe('ExplorePage', () => {
  it('muestra el total del catálogo sin filtros y pagina', () => {
    renderWithProviders(<ExplorePage />, { route: '/recetas' });
    expect(screen.getByTestId('results-summary')).toHaveTextContent(`${recipes.length} recetas`);
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(24);
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
  });

  it('aplica los filtros de la URL', () => {
    renderWithProviders(<ExplorePage />, { route: '/recetas?dieta=vegana&cat=sopa' });
    const expected = recipes.filter((r) => r.diet === 'vegana' && r.category === 'sopa').length;
    expect(screen.getByTestId('results-summary')).toHaveTextContent(`${expected} recetas`);
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(expected);
  });

  it('filtra al escribir en el buscador', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExplorePage />, { route: '/recetas' });
    await user.type(screen.getByTestId('search-input'), 'hummus');
    await waitFor(() => expect(screen.getByTestId('results-summary')).toHaveTextContent('para “hummus”'));
    const cards = screen.getAllByTestId('recipe-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(recipes.length);
  });

  it('cambia la dieta desde el panel de filtros y muestra el filtro activo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExplorePage />, { route: '/recetas' });
    await user.click(screen.getByRole('button', { name: 'Vegetariana' }));
    expect(screen.getByTestId('results-summary')).toHaveTextContent(`${stats.vegetarian} recetas`);
    await user.click(screen.getByRole('button', { name: 'Quitar filtro Vegetariana' }));
    expect(screen.getByTestId('results-summary')).toHaveTextContent(`${recipes.length} recetas`);
  });

  it('muestra estado vacío y permite limpiar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExplorePage />, { route: '/recetas?q=zzzzqqq' });
    expect(screen.getByText('No encontramos recetas con esos criterios')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda y filtros' }));
    await waitFor(() => expect(screen.getByTestId('results-summary')).toHaveTextContent(`${recipes.length} recetas`));
  });
});
