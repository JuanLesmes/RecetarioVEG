import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createCloudAdapterFromEnv } from '@/services/supabaseAdapter';
import type { AuthResult, CloudAdapter, CloudUser } from '@/services/cloud';

export interface AuthState {
  /** true cuando hay un proveedor de nube configurado (Supabase); false en modo local. */
  cloudEnabled: boolean;
  adapter: CloudAdapter | null;
  user: CloudUser | null;
  /** true mientras se recupera la sesión inicial. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const NO_CLOUD = 'No hay un servidor configurado: la app funciona en modo local.';

export function AuthProvider({ adapter: adapterProp, children }: { adapter?: CloudAdapter | null; children: ReactNode }) {
  const [adapter] = useState<CloudAdapter | null>(() => (adapterProp === undefined ? createCloudAdapterFromEnv() : adapterProp));
  const [user, setUser] = useState<CloudUser | null>(null);
  const [loading, setLoading] = useState<boolean>(adapter !== null);

  useEffect(() => {
    if (!adapter) return;
    let active = true;
    adapter
      .getSession()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    const unsubscribe = adapter.onAuthChange((u) => {
      if (active) setUser(u);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [adapter]);

  const requireAdapter = useCallback((): CloudAdapter => {
    if (!adapter) throw new Error(NO_CLOUD);
    return adapter;
  }, [adapter]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await requireAdapter().signIn(email, password);
      if (result.user) setUser(result.user);
      return result;
    },
    [requireAdapter],
  );
  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await requireAdapter().signUp(email, password, name);
      if (result.user) setUser(result.user);
      return result;
    },
    [requireAdapter],
  );
  const signOut = useCallback(async () => {
    await requireAdapter().signOut();
    setUser(null);
  }, [requireAdapter]);
  const resetPassword = useCallback((email: string) => requireAdapter().resetPassword(email), [requireAdapter]);
  const updateName = useCallback(
    async (name: string) => {
      await requireAdapter().updateName(name);
      setUser((u) => (u ? { ...u, name } : u));
    },
    [requireAdapter],
  );

  const value = useMemo<AuthState>(
    () => ({ cloudEnabled: adapter !== null, adapter, user, loading, signIn, signUp, signOut, resetPassword, updateName }),
    [adapter, user, loading, signIn, signUp, signOut, resetPassword, updateName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- el hook convive con su proveedor a propósito
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
