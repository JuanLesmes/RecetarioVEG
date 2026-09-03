import type { ShoppingItem } from './shopping';
import type { WeekPlan } from './planner';

/** Estado personal que se sincroniza con la nube cuando hay sesión. */
export interface UserState {
  favorites: string[];
  pantry: string[];
  shopping: ShoppingItem[];
  plan: WeekPlan;
}

export const EMPTY_USER_STATE: UserState = { favorites: [], pantry: [], shopping: [], plan: {} };

function uniqueStrings(a: readonly string[], b: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of [...a, ...b]) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/**
 * Combina el estado local (este dispositivo) con el remoto (la cuenta) al iniciar sesión.
 * Nada se pierde: favoritos y despensa se unen; la lista de mercado se une por id
 * conservando lo marcado; en el plan gana el remoto salvo en las franjas que solo el local llenó.
 */
export function mergeUserState(local: UserState, remote: UserState): UserState {
  const shoppingById = new Map<string, ShoppingItem>();
  for (const item of [...remote.shopping, ...local.shopping]) {
    const existing = shoppingById.get(item.id);
    if (!existing) shoppingById.set(item.id, item);
    else shoppingById.set(item.id, { ...existing, checked: existing.checked || item.checked });
  }
  const shopping = [...shoppingById.values()].sort((a, b) => a.addedAt - b.addedAt);

  return {
    favorites: uniqueStrings(remote.favorites, local.favorites),
    pantry: uniqueStrings(remote.pantry, local.pantry),
    shopping,
    plan: { ...local.plan, ...remote.plan },
  };
}

export function isSameUserState(a: UserState, b: UserState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Sanea un estado leído de la nube o del almacenamiento: descarta lo que no tenga la forma esperada. */
export function coerceUserState(value: unknown): UserState {
  const v = (value ?? {}) as Partial<Record<keyof UserState, unknown>>;
  const shopping = Array.isArray(v.shopping)
    ? (v.shopping as unknown[]).filter((i): i is ShoppingItem => !!i && typeof i === 'object' && typeof (i as ShoppingItem).id === 'string' && typeof (i as ShoppingItem).name === 'string')
    : [];
  const plan: WeekPlan = {};
  if (v.plan && typeof v.plan === 'object' && !Array.isArray(v.plan)) {
    for (const [k, id] of Object.entries(v.plan as Record<string, unknown>)) if (typeof id === 'string') plan[k] = id;
  }
  return {
    favorites: isStringArray(v.favorites) ? v.favorites : [],
    pantry: isStringArray(v.pantry) ? v.pantry : [],
    shopping,
    plan,
  };
}
