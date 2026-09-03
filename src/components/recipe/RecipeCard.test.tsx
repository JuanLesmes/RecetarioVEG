import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { recipes } from '@/data';
import { renderWithProviders } from '@/test/render';
import { RecipeCard } from './RecipeCard';

describe('RecipeCard', () => {
  const recipe = recipes[0];

  it('muestra título, dieta, tiempo y enlace a la receta', () => {
    renderWithProviders(<RecipeCard recipe={recipe} />);
    expect(screen.getByRole('heading', { name: recipe.title })).toBeInTheDocument();
    expect(screen.getByTestId('diet-badge')).toHaveTextContent(recipe.diet === 'vegana' ? 'Vegana' : 'Vegetariana');
    expect(screen.getByRole('link', { name: recipe.title })).toHaveAttribute('href', `/receta/${recipe.id}`);
  });

  it('alterna favoritos y lo persiste', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipeCard recipe={recipe} />);
    const fav = screen.getByRole('button', { name: `Guardar ${recipe.title} en favoritos` });
    await user.click(fav);
    expect(screen.getByRole('button', { name: `Quitar ${recipe.title} de favoritos` })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(window.localStorage.getItem('rveg:favorites') ?? '[]')).toEqual([recipe.id]);
    await user.click(screen.getByRole('button', { name: `Quitar ${recipe.title} de favoritos` }));
    expect(JSON.parse(window.localStorage.getItem('rveg:favorites') ?? '[]')).toEqual([]);
  });
});
