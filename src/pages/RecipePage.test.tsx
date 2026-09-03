import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { recipes } from '@/data';
import { formatQuantity } from '@/domain/scaling';
import { renderWithProviders } from '@/test/render';
import { RecipePage } from './RecipePage';
import { ShoppingListPage } from './ShoppingListPage';

const recipe = recipes.find((r) => r.ingredients.some((i) => i.quantity !== null && i.unit === 'g')) ?? recipes[0];
const gramIngredient = recipe.ingredients.find((i) => i.quantity !== null && i.unit === 'g')!;

function renderRecipe(id = recipe.id) {
  return renderWithProviders(
    <Routes>
      <Route path="/receta/:id" element={<RecipePage />} />
      <Route path="/lista-de-compras" element={<ShoppingListPage />} />
    </Routes>,
    { route: `/receta/${id}` },
  );
}

describe('RecipePage', () => {
  it('muestra título, ingredientes, pasos y consejos', () => {
    renderRecipe();
    expect(screen.getByRole('heading', { level: 1, name: recipe.title })).toBeInTheDocument();
    expect(within(screen.getByTestId('ingredient-list')).getAllByRole('listitem')).toHaveLength(recipe.ingredients.length);
    expect(within(screen.getByTestId('step-list')).getAllByRole('listitem')).toHaveLength(recipe.steps.length);
    expect(screen.getByText(recipe.tips[0])).toBeInTheDocument();
    expect(screen.getByTestId('cook-mode-link')).toHaveAttribute('href', `/receta/${recipe.id}/cocinar`);
  });

  it('reescala las cantidades al cambiar las porciones', async () => {
    const user = userEvent.setup();
    renderRecipe();
    const original = formatQuantity(gramIngredient.quantity!, 'g');
    expect(screen.getByText(`${original} g`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Más porciones' }));
    const expected = formatQuantity((gramIngredient.quantity! * (recipe.servings + 1)) / recipe.servings, 'g');
    expect(screen.getByTestId('servings-value')).toHaveTextContent(`${recipe.servings + 1} porciones`);
    expect(screen.getByText(`${expected} g`)).toBeInTheDocument();
  });

  it('guarda en favoritos y agrega ingredientes a la lista de compras', async () => {
    const user = userEvent.setup();
    renderRecipe();
    await user.click(screen.getByTestId('favorite-button'));
    expect(screen.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(window.localStorage.getItem('rveg:favorites') ?? '[]')).toContain(recipe.id);

    await user.click(screen.getByTestId('add-to-shopping'));
    const stored = JSON.parse(window.localStorage.getItem('rveg:shopping') ?? '[]') as { recipeId: string }[];
    expect(stored).toHaveLength(recipe.ingredients.length);
    expect(stored.every((i) => i.recipeId === recipe.id)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Ver lista' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Lista de mercado' })).toBeInTheDocument();
    expect(screen.getByTestId('shopping-pending')).toHaveTextContent(`${recipe.ingredients.length} pendientes`);
  });

  it('muestra "no encontrado" para ids inexistentes', () => {
    renderRecipe('receta-que-no-existe');
    expect(screen.getByText('No encontramos esa receta.')).toBeInTheDocument();
  });

  it('registra la receta como vista recientemente', () => {
    renderRecipe();
    expect(JSON.parse(window.localStorage.getItem('rveg:recent') ?? '[]')).toEqual([recipe.id]);
  });
});
