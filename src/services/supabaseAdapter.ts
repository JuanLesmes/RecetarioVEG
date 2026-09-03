import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { coerceUserState, type UserState } from '@/domain/sync';
import { userRecipeSchema, type UserRecipe } from '@/domain/userRecipe';
import { CloudError, translateAuthError, type AuthResult, type CloudAdapter, type CloudUser } from './cloud';

function toCloudUser(user: User | null | undefined): CloudUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { display_name?: string; full_name?: string; name?: string };
  const email = user.email ?? '';
  return {
    id: user.id,
    email,
    name: meta.display_name || meta.full_name || meta.name || email.split('@')[0] || 'Cocinero',
  };
}

interface RecipeRow {
  id: string;
  user_id: string;
  title: string;
  status: 'privada' | 'publicada';
  data: unknown;
  author_name: string;
  created_at: string;
  updated_at: string;
}

function rowToRecipe(row: RecipeRow): UserRecipe | null {
  const parsed = userRecipeSchema.safeParse({
    id: row.id,
    status: row.status,
    authorId: row.user_id,
    authorName: row.author_name ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: row.data,
  });
  return parsed.success ? parsed.data : null;
}

/** Implementación del contrato de nube sobre Supabase (Auth + Postgres con RLS). */
export function createSupabaseAdapter(client: SupabaseClient): CloudAdapter {
  const fail = (error: { message: string } | null): never => {
    throw new CloudError(translateAuthError(error?.message ?? 'Error desconocido'));
  };

  return {
    async getSession() {
      const { data } = await client.auth.getSession();
      return toCloudUser(data.session?.user);
    },

    onAuthChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => callback(toCloudUser(session?.user)));
      return () => data.subscription.unsubscribe();
    },

    async signUp(email, password, name): Promise<AuthResult> {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (error) fail(error);
      const user = toCloudUser(data.user);
      const needsConfirmation = !data.session;
      return { user: needsConfirmation ? null : user, message: needsConfirmation ? 'Te enviamos un correo para confirmar la cuenta. Ábrelo y luego inicia sesión.' : undefined };
    },

    async signIn(email, password): Promise<AuthResult> {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) fail(error);
      return { user: toCloudUser(data.user) };
    },

    async signOut() {
      await client.auth.signOut();
    },

    async resetPassword(email) {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}cuenta` : undefined;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) fail(error);
    },

    async updateName(name) {
      const { data, error } = await client.auth.updateUser({ data: { display_name: name } });
      if (error) fail(error);
      if (data.user) await client.from('profiles').upsert({ id: data.user.id, display_name: name });
    },

    async loadState(userId): Promise<UserState | null> {
      const { data, error } = await client.from('user_state').select('favorites, pantry, shopping, plan').eq('user_id', userId).maybeSingle();
      if (error) fail(error);
      return data ? coerceUserState(data) : null;
    },

    async saveState(userId, state) {
      const { error } = await client.from('user_state').upsert({ user_id: userId, ...state }, { onConflict: 'user_id' });
      if (error) fail(error);
    },

    async listMyRecipes(userId) {
      const { data, error } = await client.from('user_recipes').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
      if (error) fail(error);
      return ((data ?? []) as RecipeRow[]).map(rowToRecipe).filter((r): r is UserRecipe => r !== null);
    },

    async listCommunityRecipes() {
      const { data, error } = await client
        .from('user_recipes')
        .select('*')
        .eq('status', 'publicada')
        .order('updated_at', { ascending: false })
        .limit(300);
      if (error) fail(error);
      return ((data ?? []) as RecipeRow[]).map(rowToRecipe).filter((r): r is UserRecipe => r !== null);
    },

    async saveRecipe(recipe) {
      if (!recipe.authorId) throw new CloudError('Inicia sesión para guardar en la nube.');
      const { error } = await client.from('user_recipes').upsert(
        {
          id: recipe.id,
          user_id: recipe.authorId,
          title: recipe.data.title,
          status: recipe.status,
          data: recipe.data,
          author_name: recipe.authorName,
        },
        { onConflict: 'id' },
      );
      if (error) fail(error);
    },

    async deleteRecipe(id) {
      const { error } = await client.from('user_recipes').delete().eq('id', id);
      if (error) fail(error);
    },
  };
}

/** Crea el adaptador solo si las variables de entorno están configuradas; si no, la app funciona en modo local. */
export function createCloudAdapterFromEnv(): CloudAdapter | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  try {
    return createSupabaseAdapter(createClient(url, key));
  } catch (e) {
    console.error('No se pudo inicializar Supabase; se usa el modo local.', e);
    return null;
  }
}
