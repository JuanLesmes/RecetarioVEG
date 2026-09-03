import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toasts } from '@/components/ui/Toasts';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <Header />
      <main id="contenido" className="layout__main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}
