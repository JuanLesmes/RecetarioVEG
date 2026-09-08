import { describe, expect, it } from 'vitest';
import { estimateNutrition, findNutritionEntry, ingredientGrams } from './nutrition';
import { NUTRITION_TABLE } from './nutritionTable';
import { normalize } from './text';

describe('tabla nutricional', () => {
  it('tiene entradas suficientes, sin términos de coincidencia repetidos ni valores absurdos', () => {
    expect(NUTRITION_TABLE.length).toBeGreaterThanOrEqual(150);
    const seen = new Map<string, string>();
    for (const e of NUTRITION_TABLE) {
      expect(e.per100g.calories).toBeGreaterThanOrEqual(0);
      expect(e.per100g.calories).toBeLessThanOrEqual(900);
      expect(e.per100g.protein + e.per100g.carbs + e.per100g.fat).toBeLessThanOrEqual(101);
      for (const term of e.match) {
        const key = normalize(term);
        const owner = seen.get(key);
        expect(owner === undefined || owner === e.name, `término "${term}" repetido en "${e.name}" y "${owner}"`).toBe(true);
        seen.set(key, e.name);
      }
    }
  });
});

describe('findNutritionEntry', () => {
  it('reconoce nombres canónicos, plurales y alias de otros países', () => {
    expect(findNutritionEntry('huevos')?.per100g.protein).toBeGreaterThan(10);
    expect(findNutritionEntry('cebolla cabezona blanca')?.name).toMatch(/cebolla/);
    expect(findNutritionEntry('calabaza')?.name).toBe('ahuyama');
    expect(findNutritionEntry('cacahuate tostado', ['maní'])?.name).toMatch(/man[ií]/);
    expect(findNutritionEntry('ingrediente inventado xyz')).toBeUndefined();
  });
  it('prefiere el término más específico', () => {
    const coco = findNutritionEntry('leche de coco');
    const entera = findNutritionEntry('leche entera');
    expect(coco?.name).not.toBe(entera?.name);
    expect(coco?.per100g.fat).toBeGreaterThan(entera?.per100g.fat ?? 0);
  });
});

describe('ingredientGrams', () => {
  it('convierte unidades a gramos usando la tabla o los valores por defecto', () => {
    const huevo = findNutritionEntry('huevo');
    expect(ingredientGrams({ quantity: 2, unit: 'unidad' }, huevo)).toBeGreaterThanOrEqual(90);
    expect(ingredientGrams({ quantity: 250, unit: 'g' })).toBe(250);
    expect(ingredientGrams({ quantity: 1, unit: 'kg' })).toBe(1000);
    expect(ingredientGrams({ quantity: 2, unit: 'cucharada' })).toBe(30);
    expect(ingredientGrams({ quantity: null, unit: null })).toBeNull();
    const aceite = findNutritionEntry('aceite de oliva');
    const ml = ingredientGrams({ quantity: 100, unit: 'ml' }, aceite);
    expect(ml).toBeGreaterThan(85);
    expect(ml).toBeLessThanOrEqual(100);
  });
});

describe('estimateNutrition', () => {
  it('suma por ingrediente, divide por porción y reporta cobertura', () => {
    const estimate = estimateNutrition(
      [
        { name: 'arroz blanco', quantity: 200, unit: 'g' },
        { name: 'aceite de oliva', quantity: 1, unit: 'cucharada' },
        { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
        { name: 'polvo mágico de unicornio', quantity: 10, unit: 'g' },
      ],
      2,
    );
    expect(estimate.lines.map((l) => l.name)).toEqual(expect.arrayContaining(['arroz blanco', 'aceite de oliva']));
    expect(estimate.unmatched).toEqual(['polvo mágico de unicornio']);
    expect(estimate.skipped).toEqual(['sal']);
    expect(estimate.coverage).toBeCloseTo(2 / 3);
    expect(estimate.perServing.calories).toBeGreaterThan(300);
    expect(estimate.perServing.calories).toBeLessThan(500);
    expect(estimate.perServing.calories * 2).toBeCloseTo(estimate.total.calories, -1);
    expect(estimate.lines[0].calories).toBeGreaterThanOrEqual(estimate.lines[1].calories);
  });

  it('sin ingredientes reconocibles devuelve ceros', () => {
    const estimate = estimateNutrition([{ name: 'sal', quantity: null, unit: null }], 4);
    expect(estimate.perServing.calories).toBe(0);
    expect(estimate.coverage).toBe(0);
  });
});
