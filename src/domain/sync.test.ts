import { describe, expect, it } from 'vitest';
import { coerceUserState, EMPTY_USER_STATE, isSameUserState, mergeUserState, type UserState } from './sync';
import type { ShoppingItem } from './shopping';

const item = (id: string, over: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id,
  name: `item ${id}`,
  quantity: 1,
  unit: null,
  recipeId: 'r',
  recipeTitle: 'R',
  checked: false,
  addedAt: Number(id.replace(/\D/g, '')) || 0,
  ...over,
});

describe('mergeUserState', () => {
  it('une favoritos y despensa sin duplicados (insensible a mayúsculas) y prioriza el orden remoto', () => {
    const local: UserState = { ...EMPTY_USER_STATE, favorites: ['a', 'b'], pantry: ['Papa', 'huevo'] };
    const remote: UserState = { ...EMPTY_USER_STATE, favorites: ['b', 'c'], pantry: ['papa', 'arroz'] };
    const merged = mergeUserState(local, remote);
    expect(merged.favorites).toEqual(['b', 'c', 'a']);
    expect(merged.pantry).toEqual(['papa', 'arroz', 'huevo']);
  });

  it('une la lista de mercado por id, conserva lo marcado y ordena por fecha', () => {
    const local: UserState = { ...EMPTY_USER_STATE, shopping: [item('i3'), item('i1', { checked: true })] };
    const remote: UserState = { ...EMPTY_USER_STATE, shopping: [item('i1'), item('i2')] };
    const merged = mergeUserState(local, remote);
    expect(merged.shopping.map((i) => i.id)).toEqual(['i1', 'i2', 'i3']);
    expect(merged.shopping[0].checked).toBe(true);
  });

  it('en el plan gana el remoto pero conserva las franjas que solo el local tenía', () => {
    const local: UserState = { ...EMPTY_USER_STATE, plan: { 'lunes|cena': 'a', 'martes|cena': 'b' } };
    const remote: UserState = { ...EMPTY_USER_STATE, plan: { 'lunes|cena': 'z' } };
    expect(mergeUserState(local, remote).plan).toEqual({ 'lunes|cena': 'z', 'martes|cena': 'b' });
  });

  it('con remoto vacío devuelve el local intacto', () => {
    const local: UserState = { favorites: ['x'], pantry: ['y'], shopping: [item('i1')], plan: { 'lunes|cena': 'a' } };
    expect(isSameUserState(mergeUserState(local, EMPTY_USER_STATE), local)).toBe(true);
  });
});

describe('coerceUserState', () => {
  it('descarta valores malformados', () => {
    const state = coerceUserState({ favorites: ['a', 1], pantry: 'no', shopping: [{ id: 'x', name: 'n' }, { nope: true }], plan: { 'lunes|cena': 'a', bad: 3 } });
    expect(state.favorites).toEqual([]);
    expect(state.pantry).toEqual([]);
    expect(state.shopping).toHaveLength(1);
    expect(state.plan).toEqual({ 'lunes|cena': 'a' });
    expect(coerceUserState(null)).toEqual(EMPTY_USER_STATE);
  });
});
