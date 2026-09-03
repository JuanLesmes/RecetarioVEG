import { useEffect } from 'react';

const BASE = 'Recetario VEG';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${BASE}` : `${BASE} · Recetas veganas y vegetarianas`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
