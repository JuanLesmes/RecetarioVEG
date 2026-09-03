import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { recipes } from '@/data';
import { renderWithProviders } from '@/test/render';
import { PantryPage } from './PantryPage';

describe('PantryPage', () => {
  it('muestra el estado vacío sin ingredientes', () => {
    renderWithProviders(<PantryPage />, { route: '/despensa' });
    expect(screen.getByText('Cuéntanos qué tienes')).toBeInTheDocument();
  });

  it('agrega ingredientes, persiste y muestra coincidencias con lo que falta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PantryPage />, { route: '/despensa' });
    const input = screen.getByTestId('pantry-input');
    await user.type(input, 'garbanzos, cebolla{Enter}');
    const chips = within(screen.getByTestId('pantry-chips')).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['garbanzos', 'cebolla']);
    expect(JSON.parse(window.localStorage.getItem('rveg:pantry') ?? '[]')).toEqual(['garbanzos', 'cebolla']);

    expect(screen.getByTestId('pantry-summary')).toHaveTextContent(/recetas con tus ingredientes/);
    const footers = screen.getAllByTestId('match-footer');
    expect(footers.length).toBeGreaterThan(0);
    expect(footers[0]).toHaveTextContent(/ingredientes/);
    expect(screen.getAllByText(/Te falta/).length).toBeGreaterThan(0);
  });

  it('el autocompletado sugiere ingredientes del catálogo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PantryPage />, { route: '/despensa' });
    await user.type(screen.getByTestId('pantry-input'), 'agua');
    const options = await screen.findAllByRole('option');
    expect(options.some((o) => /aguacate/i.test(o.textContent ?? ''))).toBe(true);
    await user.click(within(options[0]).getByRole('button'));
    expect(within(screen.getByTestId('pantry-chips')).getAllByRole('button')).toHaveLength(1);
  });

  it('con "solo lo que puedo hacer ya" solo muestra recetas completas', async () => {
    const user = userEvent.setup();
    const recipe = recipes.find((r) => r.ingredients.length <= 8) ?? recipes[0];
    window.localStorage.setItem('rveg:pantry', JSON.stringify(recipe.ingredients.map((i) => i.name)));
    renderWithProviders(<PantryPage />, { route: '/despensa' });
    await user.click(screen.getByTestId('pantry-only-complete'));
    const cards = screen.getAllByTestId('recipe-card');
    expect(cards.some((c) => c.getAttribute('data-recipe-id') === recipe.id)).toBe(true);
    for (const footer of screen.getAllByTestId('match-footer')) expect(footer).toHaveTextContent('¡Lo puedes hacer ya!');
  });

  it('quita ingredientes desde los chips', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('rveg:pantry', JSON.stringify(['papa', 'huevo']));
    renderWithProviders(<PantryPage />, { route: '/despensa' });
    await user.click(screen.getByRole('button', { name: 'Quitar papa' }));
    expect(JSON.parse(window.localStorage.getItem('rveg:pantry') ?? '[]')).toEqual(['huevo']);
  });
});
