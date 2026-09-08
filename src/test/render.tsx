import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/store/AppContext';
import { AuthProvider } from '@/store/AuthContext';
import { RecipesProvider } from '@/store/RecipesContext';
import { CloudSync } from '@/store/CloudSync';
import { Toasts } from '@/components/ui/Toasts';
import type { CloudAdapter } from '@/services/cloud';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  path?: string;
  /** Adaptador de nube simulado; por defecto null = modo local. */
  adapter?: CloudAdapter | null;
}

/** Renderiza un elemento con todos los proveedores de la app y un router en memoria. */
export function renderWithProviders(ui: ReactElement, { route = '/', path, adapter = null, ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider adapter={adapter}>
        <AppProvider>
          <RecipesProvider>
            <CloudSync />
            {path ? (
              <Routes>
                <Route path={path} element={children} />
              </Routes>
            ) : (
              children
            )}
            <Toasts />
          </RecipesProvider>
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
