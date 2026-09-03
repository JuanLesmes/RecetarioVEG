import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { recipes } from '@/data';
import { renderWithProviders } from '@/test/render';
import { App } from './App';

describe('App (rutas)', () => {
  it('renderiza la portada con el catálogo', () => {
    renderWithProviders(<App />, { route: '/' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cocina de plantas, sin complicarte.');
    expect(screen.getByText(`${recipes.length}`)).toBeInTheDocument();
  });

  it('navega de la portada a una categoría y a una receta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });
    await user.click(screen.getByRole('link', { name: /Postres/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Explorar recetas' })).toBeInTheDocument();
    const firstCard = screen.getAllByTestId('recipe-card')[0];
    const title = firstCard.querySelector('.recipe-card__title')?.textContent ?? '';
    await user.click(screen.getByRole('link', { name: title }));
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('abre y navega el modo cocina', async () => {
    const user = userEvent.setup();
    const recipe = recipes[0];
    renderWithProviders(<App />, { route: `/receta/${recipe.id}/cocinar` });
    expect(screen.getByTestId('cook-step-text')).toHaveTextContent(recipe.steps[0]);
    await user.click(screen.getByTestId('cook-next'));
    expect(screen.getByTestId('cook-step-text')).toHaveTextContent(recipe.steps[1]);
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('cook-step-text')).toHaveTextContent(recipe.steps[0]);
    for (let i = 0; i < recipe.steps.length; i++) await user.keyboard('{ArrowRight}');
    await user.click(screen.getByTestId('cook-finish'));
    expect(screen.getByRole('heading', { level: 1, name: recipe.title })).toBeInTheDocument();
  });

  it('muestra 404 en rutas desconocidas y alterna el tema', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/no-existe' });
    expect(screen.getByText('Ups, aquí no hay nada servido')).toBeInTheDocument();
    await user.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('rveg:theme')).toBe('"dark"');
  });
});
