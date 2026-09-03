import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { recipes } from '@/data';
import { itemsFromRecipe } from '@/domain/shopping';
import { renderWithProviders } from '@/test/render';
import { ShoppingListPage } from './ShoppingListPage';

describe('ShoppingListPage', () => {
  it('muestra el estado vacío', () => {
    renderWithProviders(<ShoppingListPage />, { route: '/lista-de-compras' });
    expect(screen.getByText('Tu lista está vacía')).toBeInTheDocument();
  });

  it('marca ítems, agrega manuales, quita marcados y copia como texto', async () => {
    const user = userEvent.setup();
    const recipe = recipes[0];
    window.localStorage.setItem('rveg:shopping', JSON.stringify(itemsFromRecipe(recipe)));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderWithProviders(<ShoppingListPage />, { route: '/lista-de-compras' });
    expect(screen.getByTestId('shopping-pending')).toHaveTextContent(`${recipe.ingredients.length} pendientes`);

    const first = screen.getAllByRole('checkbox')[0];
    await user.click(first);
    expect(screen.getByTestId('shopping-pending')).toHaveTextContent(`${recipe.ingredients.length - 1} pendientes`);

    await user.type(screen.getByLabelText('Nuevo ítem'), 'papel de hornear');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('papel de hornear')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar marcados' }));
    expect(screen.getByTestId('shopping-pending')).toHaveTextContent(`${recipe.ingredients.length} pendientes de ${recipe.ingredients.length}`);

    await user.click(screen.getByRole('button', { name: 'Copiar como texto' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('[ ] ');
  });

  it('agrupa por receta en la vista "Por receta"', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('rveg:shopping', JSON.stringify([...itemsFromRecipe(recipes[0]), ...itemsFromRecipe(recipes[1])]));
    renderWithProviders(<ShoppingListPage />, { route: '/lista-de-compras' });
    await user.click(screen.getByRole('button', { name: 'Por receta' }));
    expect(screen.getByRole('heading', { name: recipes[0].title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: recipes[1].title })).toBeInTheDocument();
  });
});
