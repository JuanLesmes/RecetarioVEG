import { useCallback, useEffect, useRef, useState } from 'react';

type Validator<T> = (value: unknown) => value is T;

function readStorage<T>(key: string, fallback: T, validate?: Validator<T>): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Estado persistido en localStorage con sincronización entre pestañas.
 * Tolera almacenamiento bloqueado o datos corruptos devolviendo el valor inicial.
 */
export function useLocalStorage<T>(key: string, initial: T, validate?: Validator<T>) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial, validate));
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(readStorage(key, initial, validate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible: se mantiene solo en memoria */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== window.localStorage) return;
      setValue(readStorage(key, initial, validate));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, setValue, reset] as const;
}
