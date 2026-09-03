import type { AuthResult, CloudAdapter, CloudUser } from '@/services/cloud';
import { CloudError } from '@/services/cloud';
import type { UserState } from '@/domain/sync';
import type { UserRecipe } from '@/domain/userRecipe';

/** Adaptador de nube en memoria para pruebas: simula cuentas, estado y recetas. */
export function createFakeCloud(seed: { users?: { email: string; password: string; name: string }[]; states?: Record<string, UserState>; recipes?: UserRecipe[] } = {}) {
  const users = new Map<string, { id: string; email: string; password: string; name: string }>();
  for (const [i, u] of (seed.users ?? []).entries()) users.set(u.email, { id: `user-${i + 1}`, ...u });
  const states = new Map<string, UserState>(Object.entries(seed.states ?? {}));
  const recipes = new Map<string, UserRecipe>((seed.recipes ?? []).map((r) => [r.id, r]));
  let current: CloudUser | null = null;
  const listeners = new Set<(u: CloudUser | null) => void>();
  const calls: string[] = [];

  const emit = () => listeners.forEach((l) => l(current));

  const adapter: CloudAdapter = {
    async getSession() {
      calls.push('getSession');
      return current;
    },
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async signUp(email, password, name): Promise<AuthResult> {
      calls.push('signUp');
      if (users.has(email)) throw new CloudError('Ya existe una cuenta con ese correo.');
      const user = { id: `user-${users.size + 1}`, email, password, name };
      users.set(email, user);
      current = { id: user.id, email, name };
      emit();
      return { user: current };
    },
    async signIn(email, password): Promise<AuthResult> {
      calls.push('signIn');
      const u = users.get(email);
      if (!u || u.password !== password) throw new CloudError('Correo o contraseña incorrectos.');
      current = { id: u.id, email: u.email, name: u.name };
      emit();
      return { user: current };
    },
    async signOut() {
      calls.push('signOut');
      current = null;
      emit();
    },
    async resetPassword() {
      calls.push('resetPassword');
    },
    async updateName(name) {
      calls.push('updateName');
      if (current) current = { ...current, name };
    },
    async loadState(userId) {
      calls.push('loadState');
      return states.get(userId) ?? null;
    },
    async saveState(userId, state) {
      calls.push('saveState');
      states.set(userId, JSON.parse(JSON.stringify(state)));
    },
    async listMyRecipes(userId) {
      calls.push('listMyRecipes');
      return [...recipes.values()].filter((r) => r.authorId === userId);
    },
    async listCommunityRecipes() {
      calls.push('listCommunityRecipes');
      return [...recipes.values()].filter((r) => r.status === 'publicada');
    },
    async saveRecipe(recipe) {
      calls.push('saveRecipe');
      recipes.set(recipe.id, JSON.parse(JSON.stringify(recipe)));
    },
    async deleteRecipe(id) {
      calls.push('deleteRecipe');
      recipes.delete(id);
    },
  };

  return { adapter, calls, states, recipes, users, get currentUser() { return current; } };
}
