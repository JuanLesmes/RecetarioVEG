import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AppProvider } from './store/AppContext';
import { AuthProvider } from './store/AuthContext';
import { RecipesProvider } from './store/RecipesContext';
import { CloudSync } from './store/CloudSync';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <AppProvider>
            <RecipesProvider>
              <CloudSync />
              <App />
            </RecipesProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
