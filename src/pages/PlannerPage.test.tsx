import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { PlannerPage } from './PlannerPage';

describe('PlannerPage', () => {
  it('asigna una receta a un slot mediante el selector y permite quitarla', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlannerPage />, { route: '/planificador' });
    expect(screen.getByTestId('planner-summary')).toHaveTextContent('0 de 21');

    const slot = screen.getByTestId('slot-lunes-cena');
    await user.click(within(slot).getByRole('button', { name: 'Agregar' }));
    const results = await screen.findAllByTestId('picker-result');
    const chosen = results[0].textContent ?? '';
    await user.click(results[0]);

    expect(screen.getByTestId('planner-summary')).toHaveTextContent('1 de 21');
    const link = within(screen.getByTestId('slot-lunes-cena')).getByRole('link');
    expect(chosen).toContain(link.textContent ?? '');
    const stored = JSON.parse(window.localStorage.getItem('rveg:plan') ?? '{}') as Record<string, string>;
    expect(Object.keys(stored)).toEqual(['lunes|cena']);

    await user.click(within(screen.getByTestId('slot-lunes-cena')).getByRole('button', { name: /Quitar/ }));
    expect(screen.getByTestId('planner-summary')).toHaveTextContent('0 de 21');
  });

  it('completa la semana al azar y genera la lista de compras', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlannerPage />, { route: '/planificador' });
    await user.click(screen.getByTestId('planner-fill'));
    expect(screen.getByTestId('planner-summary')).toHaveTextContent('21 de 21');
    await user.click(screen.getByTestId('planner-shopping'));
    const shopping = JSON.parse(window.localStorage.getItem('rveg:shopping') ?? '[]') as unknown[];
    expect(shopping.length).toBeGreaterThan(21);
  });

  it('pide confirmación antes de vaciar el plan', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithProviders(<PlannerPage />, { route: '/planificador' });
    await user.click(screen.getByTestId('planner-fill'));
    await user.click(screen.getByRole('button', { name: 'Vaciar plan' }));
    expect(screen.getByTestId('planner-summary')).toHaveTextContent('21 de 21');
  });
});
