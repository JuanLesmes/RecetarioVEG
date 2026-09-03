export const WEEK_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const MEAL_SLOTS = ['desayuno', 'almuerzo', 'cena'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
};

/** Mapa "día|slot" -> id de receta. */
export type WeekPlan = Record<string, string>;

export function slotKey(day: WeekDay, slot: MealSlot): string {
  return `${day}|${slot}`;
}

export function parseSlotKey(key: string): { day: WeekDay; slot: MealSlot } | null {
  const [day, slot] = key.split('|');
  if (!WEEK_DAYS.includes(day as WeekDay) || !MEAL_SLOTS.includes(slot as MealSlot)) return null;
  return { day: day as WeekDay, slot: slot as MealSlot };
}

export function assignMeal(plan: WeekPlan, day: WeekDay, slot: MealSlot, recipeId: string): WeekPlan {
  return { ...plan, [slotKey(day, slot)]: recipeId };
}

export function clearMeal(plan: WeekPlan, day: WeekDay, slot: MealSlot): WeekPlan {
  const next = { ...plan };
  delete next[slotKey(day, slot)];
  return next;
}

export function plannedRecipeIds(plan: WeekPlan): string[] {
  return [...new Set(Object.values(plan))];
}

export function countPlannedMeals(plan: WeekPlan): number {
  return Object.keys(plan).length;
}

/** Elimina entradas cuyo id de receta ya no existe (por ejemplo, tras renombrar recetas). */
export function pruneMissing(plan: WeekPlan, validIds: ReadonlySet<string>): WeekPlan {
  const next: WeekPlan = {};
  for (const [key, id] of Object.entries(plan)) {
    if (validIds.has(id) && parseSlotKey(key)) next[key] = id;
  }
  return next;
}
