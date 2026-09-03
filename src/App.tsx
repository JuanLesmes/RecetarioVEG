import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { ExplorePage } from '@/pages/ExplorePage';
import { RecipePage } from '@/pages/RecipePage';
import { CookModePage } from '@/pages/CookModePage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ShoppingListPage } from '@/pages/ShoppingListPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { PantryPage } from '@/pages/PantryPage';
import { AboutPage } from '@/pages/AboutPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/receta/:id/cocinar" element={<CookModePage />} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/recetas" element={<ExplorePage />} />
        <Route path="/receta/:id" element={<RecipePage />} />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/lista-de-compras" element={<ShoppingListPage />} />
        <Route path="/planificador" element={<PlannerPage />} />
        <Route path="/despensa" element={<PantryPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
