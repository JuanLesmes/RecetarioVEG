import { describe, expect, it } from 'vitest';
import { parseFilters, serializeFilters } from './useUrlFilters';
import { EMPTY_FILTERS } from '@/domain/search';

describe('parseFilters / serializeFilters', () => {
  it('parsea parámetros válidos e ignora inválidos', () => {
    const p = new URLSearchParams('q=tofu&dieta=vegana&cat=sopa,invalida&cocina=India&dif=media&tmax=30&tag=rápido&con=ajo,cebolla&sin=nuez&orden=rapidas');
    const f = parseFilters(p);
    expect(f).toEqual({
      query: 'tofu',
      diet: 'vegana',
      categories: ['sopa'],
      cuisines: ['India'],
      difficulties: ['media'],
      maxTime: 30,
      tags: ['rápido'],
      includeIngredients: ['ajo', 'cebolla'],
      excludeIngredients: ['nuez'],
      sort: 'rapidas',
    });
  });

  it('usa valores por defecto con parámetros ausentes o corruptos', () => {
    const f = parseFilters(new URLSearchParams('dieta=carnivora&tmax=abc&orden=xyz'));
    expect(f).toEqual(EMPTY_FILTERS);
  });

  it('serializa solo lo que difiere del valor por defecto y hace ida y vuelta', () => {
    expect(serializeFilters(EMPTY_FILTERS).toString()).toBe('');
    const filters = { ...EMPTY_FILTERS, query: 'curry', diet: 'vegetariana' as const, categories: ['postre' as const], maxTime: 45 };
    const params = serializeFilters(filters, 3);
    expect(params.get('pagina')).toBe('3');
    expect(parseFilters(params)).toEqual(filters);
  });
});
