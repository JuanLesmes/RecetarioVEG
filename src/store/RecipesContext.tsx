import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { recipes as catalog } from '@/data';
import type { Recipe } from '@/domain/recipe';
import { newUserRecipeId, toRecipe, userRecipeCollectionSchema, type UserRecipe, type UserRecipeData, type UserRecipeStatus } from '@/domain/userRecipe';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from './AuthContext';

export type RecipeOrigin = 'catalogo' | 'mia' | 'comunidad';

export interface RecipesState {
  catalog: readonly Recipe[];
  /** Recetas creadas en este dispositivo o en la cuenta. */
  mine: UserRecipe[];
  /** Recetas publicadas por otras personas (solo con nube). */
  community: UserRecipe[];
  /** Catálogo + mías + comunidad, en el formato común `Recipe`. */
  all: readonly Recipe[];
  byId: (id: string) => Recipe | undefined;
  originOf: (id: string) => RecipeOrigin | undefined;
  userRecipeById: (id: string) => UserRecipe | undefined;
  saveRecipe: (data: UserRecipeData, options?: { id?: string; status?: UserRecipeStatus }) => Promise<UserRecipe>;
  deleteRecipe: (id: string) => Promise<void>;
  setStatus: (id: string, status: UserRecipeStatus) => Promise<void>;
  refreshCommunity: () => Promise<void>;
  syncing: boolean;
  cloudError: string | null;
}

const RecipesContext = createContext<RecipesState | null>(null);

const isUserRecipeList = (v: unknown): v is UserRecipe[] => userRecipeCollectionSchema.safeParse(v).success;

function newer(a: UserRecipe, b: UserRecipe): UserRecipe {
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;
}

export function RecipesProvider({ children }: { children: ReactNode }) {
  const { adapter, user } = useAuth();
  const [mine, setMine] = useLocalStorage<UserRecipe[]>('rveg:my-recipes', [], isUserRecipeList);
  const [community, setCommunity] = useState<UserRecipe[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const syncedFor = useRef<string | null>(null);

  const refreshCommunity = useCallback(async () => {
    if (!adapter) return;
    try {
      const list = await adapter.listCommunityRecipes();
      setCommunity(list);
    } catch (e) {
      setCloudError((e as Error).message);
    }
  }, [adapter]);

  useEffect(() => {
    void refreshCommunity();
  }, [refreshCommunity]);

  // Al iniciar sesión: fusiona las recetas locales con las de la cuenta y sube las que falten.
  useEffect(() => {
    if (!adapter || !user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const remote = await adapter.listMyRecipes(user.id);
        const byId = new Map<string, UserRecipe>();
        for (const r of remote) byId.set(r.id, r);
        const toUpload: UserRecipe[] = [];
        for (const local of mine) {
          const owned = { ...local, authorId: user.id, authorName: local.authorName || user.name };
          const existing = byId.get(local.id);
          if (!existing) {
            byId.set(local.id, owned);
            toUpload.push(owned);
          } else {
            const winner = newer(existing, owned);
            byId.set(local.id, winner);
            if (winner === owned) toUpload.push(owned);
          }
        }
        for (const r of toUpload) await adapter.saveRecipe(r);
        if (!cancelled) {
          setMine([...byId.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
          setCloudError(null);
        }
      } catch (e) {
        if (!cancelled) setCloudError((e as Error).message);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter, user?.id]);

  const saveRecipe = useCallback<RecipesState['saveRecipe']>(
    async (data, options = {}) => {
      const now = new Date().toISOString();
      const existing = options.id ? mine.find((r) => r.id === options.id) : undefined;
      const taken = new Set([...catalog.map((r) => r.id), ...mine.map((r) => r.id), ...community.map((r) => r.id)]);
      const id = existing?.id ?? newUserRecipeId(data.title, taken);
      const recipe: UserRecipe = {
        id,
        status: options.status ?? existing?.status ?? 'privada',
        authorId: user?.id ?? existing?.authorId ?? null,
        authorName: user?.name ?? existing?.authorName ?? 'Yo',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        data: { ...data, id },
      };
      setMine((prev) => [recipe, ...prev.filter((r) => r.id !== id)]);
      if (adapter && user) {
        try {
          await adapter.saveRecipe(recipe);
          setCloudError(null);
          if (recipe.status === 'publicada' || existing?.status === 'publicada') void refreshCommunity();
        } catch (e) {
          setCloudError((e as Error).message);
        }
      }
      return recipe;
    },
    [adapter, user, mine, community, setMine, refreshCommunity],
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      setMine((prev) => prev.filter((r) => r.id !== id));
      if (adapter && user) {
        try {
          await adapter.deleteRecipe(id);
          void refreshCommunity();
        } catch (e) {
          setCloudError((e as Error).message);
        }
      }
    },
    [adapter, user, setMine, refreshCommunity],
  );

  const setStatus = useCallback(
    async (id: string, status: UserRecipeStatus) => {
      const target = mine.find((r) => r.id === id);
      if (!target) return;
      await saveRecipe(target.data, { id, status });
    },
    [mine, saveRecipe],
  );

  const mineIds = useMemo(() => new Set(mine.map((r) => r.id)), [mine]);
  const others = useMemo(() => community.filter((r) => !mineIds.has(r.id) && r.authorId !== user?.id), [community, mineIds, user?.id]);

  const all = useMemo<readonly Recipe[]>(() => {
    const catalogIds = new Set(catalog.map((r) => r.id));
    const extra = [...mine, ...others].filter((r) => !catalogIds.has(r.id)).map(toRecipe);
    return Object.freeze([...catalog, ...extra]);
  }, [mine, others]);

  const index = useMemo(() => {
    const map = new Map<string, { recipe: Recipe; origin: RecipeOrigin; user?: UserRecipe }>();
    for (const r of catalog) map.set(r.id, { recipe: r, origin: 'catalogo' });
    for (const r of others) map.set(r.id, { recipe: toRecipe(r), origin: 'comunidad', user: r });
    for (const r of mine) map.set(r.id, { recipe: toRecipe(r), origin: 'mia', user: r });
    return map;
  }, [mine, others]);

  const byId = useCallback((id: string) => index.get(id)?.recipe, [index]);
  const originOf = useCallback((id: string) => index.get(id)?.origin, [index]);
  const userRecipeById = useCallback((id: string) => index.get(id)?.user, [index]);

  const value = useMemo<RecipesState>(
    () => ({ catalog, mine, community: others, all, byId, originOf, userRecipeById, saveRecipe, deleteRecipe, setStatus, refreshCommunity, syncing, cloudError }),
    [mine, others, all, byId, originOf, userRecipeById, saveRecipe, deleteRecipe, setStatus, refreshCommunity, syncing, cloudError],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- el hook convive con su proveedor a propósito
export function useRecipes(): RecipesState {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes debe usarse dentro de <RecipesProvider>');
  return ctx;
}
