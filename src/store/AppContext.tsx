import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { itemsFromRecipe, type ShoppingItem } from '@/domain/shopping';
import { assignMeal, clearMeal as clearMealInPlan, type MealSlot, type WeekDay, type WeekPlan } from '@/domain/planner';
import type { Recipe } from '@/domain/recipe';
import type { UserState } from '@/domain/sync';

export type Theme = 'light' | 'dark';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface AppState {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;

  shopping: ShoppingItem[];
  addRecipeToShopping: (recipe: Recipe, servings?: number) => void;
  addShoppingItem: (name: string) => void;
  toggleShoppingItems: (ids: string[], checked?: boolean) => void;
  removeShoppingItems: (ids: string[]) => void;
  clearCheckedShopping: () => void;
  clearShopping: () => void;

  plan: WeekPlan;
  setMeal: (day: WeekDay, slot: MealSlot, recipeId: string) => void;
  clearMeal: (day: WeekDay, slot: MealSlot) => void;
  clearPlan: () => void;

  recent: string[];
  markViewed: (id: string) => void;

  pantry: string[];
  addPantryItem: (name: string) => void;
  removePantryItem: (name: string) => void;
  clearPantry: () => void;

  /** Estado sincronizable (favoritos, despensa, lista y plan) y su reemplazo tras fusionar con la nube. */
  userState: UserState;
  replaceUserState: (state: UserState) => void;

  theme: Theme;
  toggleTheme: () => void;

  toasts: Toast[];
  notify: (message: string, action?: { label: string; onAction: () => void }) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isShoppingItems = (v: unknown): v is ShoppingItem[] =>
  Array.isArray(v) && v.every((x) => x && typeof x === 'object' && typeof (x as ShoppingItem).id === 'string');
const isPlan = (v: unknown): v is WeekPlan =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((x) => typeof x === 'string');
const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

function systemTheme(): Theme {
  if (typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<string[]>('rveg:favorites', [], isStringArray);
  const [shopping, setShopping] = useLocalStorage<ShoppingItem[]>('rveg:shopping', [], isShoppingItems);
  const [plan, setPlan] = useLocalStorage<WeekPlan>('rveg:plan', {}, isPlan);
  const [recent, setRecent] = useLocalStorage<string[]>('rveg:recent', [], isStringArray);
  const [pantry, setPantry] = useLocalStorage<string[]>('rveg:pantry', [], isStringArray);
  const [theme, setTheme] = useLocalStorage<Theme>('rveg:theme', systemTheme(), isTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback(
    (id: string) => setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
    [setFavorites],
  );

  const addRecipeToShopping = useCallback(
    (recipe: Recipe, servings?: number) => {
      const items = itemsFromRecipe(recipe, servings ?? recipe.servings);
      setShopping((prev) => [...prev.filter((i) => i.recipeId !== recipe.id), ...items]);
    },
    [setShopping],
  );
  const addShoppingItem = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setShopping((prev) => [
        ...prev,
        {
          id: `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          quantity: null,
          unit: null,
          recipeId: 'manual',
          recipeTitle: 'Agregado manualmente',
          checked: false,
          addedAt: Date.now(),
        },
      ]);
    },
    [setShopping],
  );
  const toggleShoppingItems = useCallback(
    (ids: string[], checked?: boolean) =>
      setShopping((prev) =>
        prev.map((i) => (ids.includes(i.id) ? { ...i, checked: checked ?? !i.checked } : i)),
      ),
    [setShopping],
  );
  const removeShoppingItems = useCallback(
    (ids: string[]) => setShopping((prev) => prev.filter((i) => !ids.includes(i.id))),
    [setShopping],
  );
  const clearCheckedShopping = useCallback(() => setShopping((prev) => prev.filter((i) => !i.checked)), [setShopping]);
  const clearShopping = useCallback(() => setShopping([]), [setShopping]);

  const setMeal = useCallback(
    (day: WeekDay, slot: MealSlot, recipeId: string) => setPlan((prev) => assignMeal(prev, day, slot, recipeId)),
    [setPlan],
  );
  const clearMeal = useCallback(
    (day: WeekDay, slot: MealSlot) => setPlan((prev) => clearMealInPlan(prev, day, slot)),
    [setPlan],
  );
  const clearPlan = useCallback(() => setPlan({}), [setPlan]);

  const markViewed = useCallback(
    (id: string) => setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8)),
    [setRecent],
  );

  const addPantryItem = useCallback(
    (name: string) => {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) return;
      setPantry((prev) => (prev.some((p) => p.toLowerCase() === trimmed) ? prev : [...prev, trimmed]));
    },
    [setPantry],
  );
  const removePantryItem = useCallback(
    (name: string) => setPantry((prev) => prev.filter((p) => p !== name)),
    [setPantry],
  );
  const clearPantry = useCallback(() => setPantry([]), [setPantry]);

  const userState = useMemo<UserState>(() => ({ favorites, pantry, shopping, plan }), [favorites, pantry, shopping, plan]);
  const replaceUserState = useCallback(
    (state: UserState) => {
      setFavorites(state.favorites);
      setPantry(state.pantry);
      setShopping(state.shopping);
      setPlan(state.plan);
    },
    [setFavorites, setPantry, setShopping, setPlan],
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [setTheme]);

  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const notify = useCallback(
    (message: string, action?: { label: string; onAction: () => void }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message, actionLabel: action?.label, onAction: action?.onAction }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  const value = useMemo<AppState>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      shopping,
      addRecipeToShopping,
      addShoppingItem,
      toggleShoppingItems,
      removeShoppingItems,
      clearCheckedShopping,
      clearShopping,
      plan,
      setMeal,
      clearMeal,
      clearPlan,
      recent,
      markViewed,
      pantry,
      addPantryItem,
      removePantryItem,
      clearPantry,
      userState,
      replaceUserState,
      theme,
      toggleTheme,
      toasts,
      notify,
      dismissToast,
    }),
    [
      favorites,
      isFavorite,
      toggleFavorite,
      shopping,
      addRecipeToShopping,
      addShoppingItem,
      toggleShoppingItems,
      removeShoppingItems,
      clearCheckedShopping,
      clearShopping,
      plan,
      setMeal,
      clearMeal,
      clearPlan,
      recent,
      markViewed,
      pantry,
      addPantryItem,
      removePantryItem,
      clearPantry,
      userState,
      replaceUserState,
      theme,
      toggleTheme,
      toasts,
      notify,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- el hook convive con su proveedor a propósito
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
