import { useMemo } from 'react';
import { recipes, stats } from '@/data';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function AboutPage() {
  useDocumentTitle('Acerca del proyecto');

  const sources = useMemo(() => {
    const map = new Map<string, { name: string; host: string; count: number }>();
    for (const r of recipes) {
      for (const s of r.sources) {
        let host = s.url;
        try {
          host = new URL(s.url).hostname.replace(/^www\./, '');
        } catch {
          /* url ya validada por el esquema */
        }
        const existing = map.get(host);
        if (existing) existing.count++;
        else map.set(host, { name: s.name, host, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.host.localeCompare(b.host));
  }, []);

  return (
    <div className="prose">
      <div className="page-head">
        <span className="eyebrow">Acerca</span>
        <h1>Cómo se construyó este recetario</h1>
      </div>
      <p>
        Recetario VEG reúne {stats.total} recetas ({stats.vegan} veganas y {stats.vegetarian} vegetarianas) de {stats.cuisines.length} cocinas
        del mundo. Cada receta incluye ingredientes con cantidades, pasos numerados, consejos, información nutricional estimada y, en las
        vegetarianas, una guía para veganizarla.
      </p>
      <h2>Metodología</h2>
      <ul>
        <li>Se investigaron cientos de páginas de referencia en español e inglés por categoría (desayunos, platos principales, sopas, etc.).</li>
        <li>Con esa investigación se redactaron recetas originales: la descripción, los pasos y los consejos son texto propio, no copiado.</li>
        <li>Cada receta enlaza las páginas consultadas como referencia, para que puedas contrastar y seguir explorando.</li>
        <li>
          Todo el catálogo se valida automáticamente contra un esquema estricto (unidades, etiquetas, cocinas, tiempos, coherencia de dieta) antes
          de publicarse.
        </li>
      </ul>
      <h2>Arquitectura</h2>
      <ul>
        <li>Aplicación web de una sola página (React + TypeScript + Vite), sin servidor: funciona en cualquier hosting estático.</li>
        <li>Capa de dominio pura (búsqueda, escalado de porciones, lista de compras, planificador) cubierta por pruebas unitarias.</li>
        <li>Datos en JSON validados con Zod al arrancar; favoritos, lista y plan persisten en el navegador.</li>
        <li>Pruebas de componentes con Testing Library y pruebas de extremo a extremo con Playwright.</li>
      </ul>
      <h2>Fuentes consultadas</h2>
      <p className="muted">Sitios de referencia usados durante la investigación, ordenados por número de recetas en que se citan.</p>
      <div className="source-list">
        {sources.map((s) => (
          <a key={s.host} href={`https://${s.host}`} target="_blank" rel="noopener noreferrer">
            {s.name}
            <small>
              {s.host} · {s.count} {s.count === 1 ? 'receta' : 'recetas'}
            </small>
          </a>
        ))}
      </div>
      <h2>Aviso</h2>
      <p className="muted">
        La información nutricional es una estimación orientativa. Si tienes alergias o condiciones médicas, revisa siempre los ingredientes y
        consulta a un profesional.
      </p>
    </div>
  );
}
