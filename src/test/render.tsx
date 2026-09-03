import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/store/AppContext';
import { Toasts } from '@/components/ui/Toasts';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  path?: string;
}

/** Renderiza un elemento con el proveedor de estado, los toasts y un router en memoria. */
export function renderWithProviders(ui: ReactElement, { route = '/', path, ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        {path ? (
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        ) : (
          children
        )}
        <Toasts />
      </AppProvider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
