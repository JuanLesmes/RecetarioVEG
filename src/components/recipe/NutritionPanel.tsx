import type { Nutrition } from '@/domain/recipe';

const ITEMS: { key: keyof Nutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteína', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
];

export function NutritionPanel({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div>
      <ul className="nutrition" aria-label="Información nutricional aproximada por porción">
        {ITEMS.map((item) => (
          <li key={item.key} className="nutrition__item">
            <div className="nutrition__value">
              {nutrition[item.key]}
              <small style={{ fontSize: '0.7rem', marginLeft: 2 }}>{item.unit}</small>
            </div>
            <div className="nutrition__label">{item.label}</div>
          </li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.6rem' }}>
        Valores estimados por porción; pueden variar según marcas y cantidades exactas.
      </p>
    </div>
  );
}
