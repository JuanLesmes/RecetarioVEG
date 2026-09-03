import { Link } from 'react-router-dom';
import { stats } from '@/data';

export function Footer() {
  return (
    <footer className="footer no-print">
      <div className="container footer__inner">
        <div>
          <strong>Recetario VEG</strong> · {stats.total} recetas veganas y vegetarianas con paso a paso.
        </div>
        <div className="footer__links">
          <Link to="/recetas">Explorar</Link>
          <Link to="/planificador">Planificador</Link>
          <Link to="/acerca">Acerca y fuentes</Link>
        </div>
      </div>
    </footer>
  );
}
