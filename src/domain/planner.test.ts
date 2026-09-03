import { describe, expect, it } from 'vitest';
import { assignMeal, clearMeal, countPlannedMeals, parseSlotKey, plannedRecipeIds, pruneMissing, slotKey } from './planner';

describe('planner', () => {
  it('asigna y limpia comidas de forma inmutable', () => {
    const empty = {};
    const withMeal = assignMeal(empty, 'lunes', 'cena', 'r1');
    expect(withMeal).toEqual({ 'lunes|cena': 'r1' });
    expect(empty).toEqual({});
    const cleared = clearMeal(withMeal, 'lunes', 'cena');
    expect(cleared).toEqual({});
    expect(withMeal).toEqual({ 'lunes|cena': 'r1' });
  });

  it('cuenta comidas y devuelve ids únicos', () => {
    const plan = assignMeal(assignMeal(assignMeal({}, 'lunes', 'cena', 'r1'), 'martes', 'almuerzo', 'r1'), 'martes', 'cena', 'r2');
    expect(countPlannedMeals(plan)).toBe(3);
    expect(plannedRecipeIds(plan)).toEqual(['r1', 'r2']);
  });

  it('parsea claves de slot válidas e inválidas', () => {
    expect(parseSlotKey(slotKey('domingo', 'desayuno'))).toEqual({ day: 'domingo', slot: 'desayuno' });
    expect(parseSlotKey('lunes|merienda')).toBeNull();
    expect(parseSlotKey('funday|cena')).toBeNull();
  });

  it('elimina recetas inexistentes y claves corruptas', () => {
    const plan = { 'lunes|cena': 'r1', 'martes|cena': 'zzz', 'x|y': 'r1' };
    expect(pruneMissing(plan, new Set(['r1']))).toEqual({ 'lunes|cena': 'r1' });
  });
});
