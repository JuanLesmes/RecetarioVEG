import { useEffect, useRef, useState } from 'react';
import { isSameUserState, mergeUserState, type UserState } from '@/domain/sync';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

export type SyncStatus = 'local' | 'cargando' | 'sincronizado' | 'guardando' | 'error';

/**
 * Sincroniza favoritos, despensa, lista y plan con la cuenta:
 * al iniciar sesión fusiona lo local con lo remoto (sin perder nada) y después
 * sube cada cambio con un pequeño retraso para agrupar ediciones seguidas.
 */
// eslint-disable-next-line react-refresh/only-export-components -- el hook y el componente comparten archivo a propósito
export function useCloudSync(): SyncStatus {
  const { adapter, user } = useAuth();
  const { userState, replaceUserState, notify } = useApp();
  const [status, setStatus] = useState<SyncStatus>('local');
  const readyFor = useRef<string | null>(null);
  const lastSaved = useRef<UserState | null>(null);

  useEffect(() => {
    if (!adapter || !user) {
      readyFor.current = null;
      lastSaved.current = null;
      setStatus('local');
      return;
    }
    if (readyFor.current === user.id) return;
    let cancelled = false;
    setStatus('cargando');
    (async () => {
      try {
        const remote = await adapter.loadState(user.id);
        const merged = remote ? mergeUserState(userState, remote) : userState;
        if (cancelled) return;
        if (!isSameUserState(merged, userState)) replaceUserState(merged);
        await adapter.saveState(user.id, merged);
        lastSaved.current = merged;
        readyFor.current = user.id;
        setStatus('sincronizado');
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          notify(`No se pudo sincronizar con tu cuenta: ${(e as Error).message}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter, user?.id]);

  useEffect(() => {
    if (!adapter || !user || readyFor.current !== user.id) return;
    if (lastSaved.current && isSameUserState(lastSaved.current, userState)) return;
    setStatus('guardando');
    const t = window.setTimeout(async () => {
      try {
        await adapter.saveState(user.id, userState);
        lastSaved.current = userState;
        setStatus('sincronizado');
      } catch {
        setStatus('error');
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [adapter, user, userState]);

  return status;
}

/** Componente sin interfaz que mantiene la sincronización activa mientras la app está montada. */
export function CloudSync() {
  useCloudSync();
  return null;
}
