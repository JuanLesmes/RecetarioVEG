import { describe, expect, it } from 'vitest';
import type { Recipe } from './recipe';
import { itemsFromRecipe, mergeItems, newItemId, toPlainText, type ShoppingItem } from './shopping';

const base: Recipe = {
  id: 'r1',
  title: 'Receta uno',
  description: 'Descripción de prueba suficientemente larga.',
  diet: 'vegana',
  category: 'sopa',
  cuisine: 'Internacional',
  difficulty: 'fácil',
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 4,
  ingredients: [
    { name: 'Cebolla', quantity: 1, unit: 'unidad' },
    { name: 'lentejas', quantity: 300, unit: 'g' },
    { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
  ],
  steps: ['Paso uno de la receta.', 'Paso dos de la receta.', 'Paso tres de la receta.'],
  tags: ['una olla'],
  tips: ['Consejo'],
  nutrition: { calories: 300, protein: 12, carbs: 40, fat: 8, fiber: 9 },
  sources: [{ name: 'Fuente', url: 'https://ejemplo.com' }],
};

describe('itemsFromRecipe', () => {
  it('crea un ítem por ingrediente escalado a las porciones pedidas', () => {
    const items = itemsFromRecipe(base, 8, 1000);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ name: 'Cebolla', quantity: 2, unit: 'unidad', recipeId: 'r1', checked: false, addedAt: 1000 });
    expect(items[1].quantity).toBe(600);
    expect(items[2].quantity).toBeNull();
  });
  it('genera ids únicos', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newItemId()));
    expect(ids.size).toBe(50);
  });
});

describe('mergeItems', () => {
  const item = (over: Partial<ShoppingItem>): ShoppingItem => ({
    id: newItemId(),
    name: 'cebolla',
    quantity: 1,
    unit: 'unidad',
    recipeId: 'r1',
    recipeTitle: 'Receta uno',
    checked: false,
    addedAt: 0,
    ...over,
  });

  it('suma cantidades de ingredientes iguales con la misma unidad (sin distinguir tildes/mayúsculas)', () => {
    const merged = mergeItems([item({ name: 'Cebolla', quantity: 1 }), item({ name: 'cebólla', quantity: 2, recipeId: 'r2', recipeTitle: 'Receta dos' })]);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].display).toBe('3 Cebolla');
    expect(merged[0].recipes).toEqual(['Receta uno', 'Receta dos']);
    expect(merged[0].itemIds).toHaveLength(2);
  });

  it('no mezcla unidades distintas', () => {
    const merged = mergeItems([item({ name: 'tomate', quantity: 2, unit: 'unidad' }), item({ name: 'tomate', quantity: 400, unit: 'g' })]);
    expect(merged).toHaveLength(2);
  });

  it('un grupo está marcado solo si todos sus ítems lo están, y los marcados van al final', () => {
    const merged = mergeItems([
      item({ name: 'ajo', checked: true }),
      item({ name: 'ajo', checked: false }),
      item({ name: 'zanahoria', checked: true }),
    ]);
    expect(merged.map((m) => [m.name, m.checked])).toEqual([
      ['ajo', false],
      ['zanahoria', true],
    ]);
  });

  it('conserva cantidad nula cuando ningún ítem la tiene y toma la numérica si aparece', () => {
    const merged = mergeItems([item({ name: 'sal', quantity: null, unit: null }), item({ name: 'sal', quantity: null, unit: null })]);
    expect(merged[0].quantity).toBeNull();
    expect(merged[0].display).toBe('sal');
    const merged2 = mergeItems([item({ name: 'sal', quantity: null, unit: null }), item({ name: 'sal', quantity: 5, unit: null })]);
    expect(merged2[0].quantity).toBe(5);
  });
});

describe('toPlainText', () => {
  it('genera una lista de verificación en texto', () => {
    const merged = mergeItems([
      { id: 'a', name: 'lentejas', quantity: 300, unit: 'g', recipeId: 'r', recipeTitle: 'R', checked: false, addedAt: 0 },
      { id: 'b', name: 'sal', quantity: null, unit: null, recipeId: 'r', recipeTitle: 'R', checked: true, addedAt: 0 },
    ]);
    expect(toPlainText(merged)).toBe('[ ] 300 g de lentejas\n[x] sal');
  });
});
