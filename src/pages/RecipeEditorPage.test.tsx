import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { RecipeEditorPage } from './RecipeEditorPage';
import { MyRecipesPage } from './MyRecipesPage';
import { RecipePage } from './RecipePage';

function renderEditor(route = '/mis-recetas/nueva') {
  return renderWithProviders(
    <Routes>
      <Route path="/mis-recetas" element={<MyRecipesPage />} />
      <Route path="/mis-recetas/nueva" element={<RecipeEditorPage />} />
      <Route path="/mis-recetas/:id/editar" element={<RecipeEditorPage />} />
      <Route path="/receta/:id" element={<RecipePage />} />
    </Routes>,
    { route },
  );
}

async function fillIngredient(user: ReturnType<typeof userEvent.setup>, idx: number, qty: string, unit: string, name: string) {
  const row = within(screen.getByTestId('ingredient-rows')).getAllByRole('listitem')[idx];
  const unitSelect = within(row).getByLabelText(`Unidad del ingrediente ${idx + 1}`);
  await user.selectOptions(unitSelect, unit);
  const qtyInput = within(row).getByLabelText(`Cantidad del ingrediente ${idx + 1}`);
  await user.clear(qtyInput);
  await user.type(qtyInput, qty);
  const nameInput = within(row).getByLabelText(`Nombre del ingrediente ${idx + 1}`);
  await user.clear(nameInput);
  await user.type(nameInput, name);
}

describe('RecipeEditorPage', () => {
  it('bloquea el guardado hasta que el borrador cumple el formato del catálogo', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByTestId('wizard-step-4'));
    await user.click(screen.getByTestId('save-private'));
    // Vuelve al primer paso con errores (título y descripción) y los marca junto a cada campo.
    expect(await screen.findByTestId('title-input')).toBeInTheDocument();
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(alerts[0]).toHaveTextContent(/al menos/i);
    expect(JSON.parse(window.localStorage.getItem('rveg:my-recipes') ?? '[]')).toHaveLength(0);
  });

  it('crea una receta completa con ayuda del asistente y la deja lista en "Mis recetas"', { timeout: 40_000 }, async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByTestId('title-input'), 'Sopa de calabaza de la casa');
    await user.type(screen.getByTestId('description-input'), 'Una crema suave y reconfortante para las noches frías, lista en menos de una hora.');
    await user.selectOptions(screen.getByTestId('category-select'), 'sopa');
    // El asistente sugiere una ilustración según el título.
    await user.click(within(screen.getByTestId('assistant')).getByRole('button', { name: 'Usar la sugerida' }));
    expect(screen.getByTestId('visual-soup')).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByTestId('wizard-next'));
    await fillIngredient(user, 0, '500', 'g', 'calabaza');
    await fillIngredient(user, 1, '1', 'unidad', 'cebolla cabezona');
    await fillIngredient(user, 2, '2', 'cucharada', 'aceite de oliva');
    // Sugerencia de nombre colombiano en línea.
    await user.click(screen.getByRole('button', { name: /En Colombia: ahuyama/ }));
    expect(screen.getByTestId('ingredient-name-0')).toHaveValue('ahuyama');

    await user.click(screen.getByTestId('wizard-next'));
    await user.type(screen.getByTestId('step-text-0'), 'Pela y pica la ahuyama en cubos medianos.');
    await user.type(screen.getByTestId('step-text-1'), 'Sofríe la cebolla 5 minutos y agrega la ahuyama con agua.');
    await user.type(screen.getByTestId('step-text-2'), 'Cocina 20 minutos, licúa y sirve caliente.');

    await user.click(screen.getByTestId('wizard-next'));
    await user.type(screen.getByTestId('tip-0'), 'Un chorrito de leche de coco la hace más cremosa.');
    await user.click(screen.getByRole('button', { name: 'sin gluten' }));
    await user.click(screen.getByTestId('estimate-nutrition'));
    expect(Number((screen.getByTestId('nutrition-calories') as HTMLInputElement).value)).toBeGreaterThan(0);

    await user.click(screen.getByTestId('wizard-next'));
    await user.click(screen.getByTestId('save-private'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mis recetas' })).toBeInTheDocument();
    expect(screen.getByTestId('my-recipes-count')).toHaveTextContent('1 receta');
    const stored = JSON.parse(window.localStorage.getItem('rveg:my-recipes') ?? '[]') as { id: string; status: string; data: { title: string; visual: string; ingredients: { name: string }[] } }[];
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe('privada');
    expect(stored[0].id).toMatch(/^sopa-de-calabaza-de-la-casa-[a-z0-9]{4}$/);
    expect(stored[0].data.visual).toBe('soup');
    expect(stored[0].data.ingredients[0].name).toBe('ahuyama');
    expect(window.localStorage.getItem('rveg:draft:nueva')).toBeNull();

    // La receta se abre con la misma ficha del catálogo.
    await user.click(screen.getByRole('link', { name: 'Sopa de calabaza de la casa' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sopa de calabaza de la casa' })).toBeInTheDocument();
    expect(screen.getByTestId('origin-badge')).toHaveTextContent('Tu receta');
    expect(screen.getByTestId('edit-recipe')).toHaveAttribute('href', `/mis-recetas/${stored[0].id}/editar`);
  });

  it('conserva el borrador si se sale del editor sin guardar', async () => {
    const user = userEvent.setup();
    const { unmount } = renderEditor();
    await user.type(screen.getByTestId('title-input'), 'Borrador a medias');
    unmount();
    renderEditor();
    expect(screen.getByTestId('title-input')).toHaveValue('Borrador a medias');
  });
});
