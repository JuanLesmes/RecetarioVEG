import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { AppProvider } from './AppContext';
import { RecipesProvider, useRecipes } from './RecipesContext';
import { emptyDraft, type UserRecipe } from '@/domain/userRecipe';
import { createFakeCloud } from '@/test/fakeCloud';
import type { CloudAdapter } from '@/services/cloud';
import { recipes as catalog } from '@/data';

function validDraft(title: string) {
  return {
    ...emptyDraft(),
    title,
    description: 'Una receta de prueba con descripción suficientemente larga para pasar.',
    visual: 'stew' as const,
    ingredients: [
      { name: 'lentejas', quantity: 300, unit: 'g' as const },
      { name: 'cebolla cabezona', quantity: 1, unit: 'unidad' as const },
      { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
    ],
    steps: ['Cocina las lentejas 25 minutos.', 'Sofríe la cebolla 5 minutos.', 'Mezcla todo y sirve caliente.'],
    tags: ['económico' as const],
    tips: ['Remoja las lentejas la noche anterior.'],
    nutrition: { calories: 320, protein: 18, carbs: 45, fat: 4, fiber: 15 },
  };
}

function wrapper(adapter: CloudAdapter | null) {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider adapter={adapter}>
      <AppProvider>
        <RecipesProvider>{children}</RecipesProvider>
      </AppProvider>
    </AuthProvider>
  );
}

describe('RecipesProvider (modo local)', () => {
  it('guarda, lista, edita y borra recetas propias sin nube', async () => {
    const { result } = renderHook(() => useRecipes(), { wrapper: wrapper(null) });
    expect(result.current.all).toHaveLength(catalog.length);

    let saved!: UserRecipe;
    await act(async () => {
      saved = await result.current.saveRecipe(validDraft('Lentejas de mi abuela'));
    });
    expect(saved.id).toMatch(/^lentejas-de-mi-abuela-[a-z0-9]{4}$/);
    expect(saved.status).toBe('privada');
    expect(saved.authorId).toBeNull();
    expect(result.current.mine).toHaveLength(1);
    expect(result.current.all).toHaveLength(catalog.length + 1);
    expect(result.current.byId(saved.id)?.title).toBe('Lentejas de mi abuela');
    expect(result.current.originOf(saved.id)).toBe('mia');
    expect(JSON.parse(window.localStorage.getItem('rveg:my-recipes') ?? '[]')).toHaveLength(1);

    await act(async () => {
      await result.current.saveRecipe({ ...validDraft('Lentejas de mi abuela (v2)') }, { id: saved.id });
    });
    expect(result.current.mine).toHaveLength(1);
    expect(result.current.byId(saved.id)?.title).toBe('Lentejas de mi abuela (v2)');

    await act(async () => {
      await result.current.deleteRecipe(saved.id);
    });
    expect(result.current.mine).toHaveLength(0);
    expect(result.current.byId(saved.id)).toBeUndefined();
  });
});

describe('RecipesProvider (con nube)', () => {
  it('al iniciar sesión sube las recetas locales, fusiona las remotas y carga la comunidad', async () => {
    const remoteMine: UserRecipe = {
      id: 'arroz-remoto-abcd',
      status: 'privada',
      authorId: 'user-1',
      authorName: 'Ana',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      data: { ...validDraft('Arroz remoto'), id: 'arroz-remoto-abcd' },
    };
    const published: UserRecipe = {
      id: 'sopa-de-otro-xyz1',
      status: 'publicada',
      authorId: 'user-9',
      authorName: 'Otro',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      data: { ...validDraft('Sopa de otro'), id: 'sopa-de-otro-xyz1' },
    };
    const cloud = createFakeCloud({ users: [{ email: 'ana@test.com', password: 'secreta123', name: 'Ana' }], recipes: [remoteMine, published] });

    const { result } = renderHook(() => ({ recipes: useRecipes(), auth: useAuth() }), { wrapper: wrapper(cloud.adapter) });
    await waitFor(() => expect(result.current.recipes.community).toHaveLength(1));
    expect(result.current.recipes.originOf('sopa-de-otro-xyz1')).toBe('comunidad');

    await act(async () => {
      await result.current.recipes.saveRecipe(validDraft('Local antes de entrar'));
    });
    expect(result.current.recipes.mine).toHaveLength(1);

    await act(async () => {
      await result.current.auth.signIn('ana@test.com', 'secreta123');
    });
    await waitFor(() => expect(result.current.recipes.mine).toHaveLength(2));
    expect(result.current.recipes.mine.every((r) => r.authorId === 'user-1')).toBe(true);
    expect(cloud.recipes.size).toBe(3);

    await act(async () => {
      await result.current.recipes.setStatus(result.current.recipes.mine.find((r) => r.data.title === 'Local antes de entrar')!.id, 'publicada');
    });
    await waitFor(() => expect([...cloud.recipes.values()].filter((r) => r.status === 'publicada')).toHaveLength(2));
    // Mis recetas publicadas no se duplican en "comunidad".
    expect(result.current.recipes.community.map((r) => r.id)).toEqual(['sopa-de-otro-xyz1']);
  });
});
