import { describe, expect, it } from 'vitest';
import { describeIngredient, formatQuantity, scaleIngredient, scaleIngredients, scaleQuantity, unitLabel } from './scaling';

describe('scaleQuantity', () => {
  it('escala proporcionalmente', () => {
    expect(scaleQuantity(200, 4, 2)).toBe(100);
    expect(scaleQuantity(1, 2, 3)).toBe(1.5);
  });
  it('rechaza porciones no positivas', () => {
    expect(() => scaleQuantity(1, 0, 2)).toThrow(RangeError);
    expect(() => scaleQuantity(1, 2, -1)).toThrow(RangeError);
  });
});

describe('formatQuantity', () => {
  it('usa fracciones para unidades discretas', () => {
    expect(formatQuantity(0.5, 'taza')).toBe('½');
    expect(formatQuantity(1.5, 'cucharada')).toBe('1½');
    expect(formatQuantity(0.25, 'cucharadita')).toBe('¼');
    expect(formatQuantity(2.333, 'unidad')).toBe('2⅓');
    expect(formatQuantity(3, 'unidad')).toBe('3');
  });
  it('redondea gramos y mililitros a valores prácticos', () => {
    expect(formatQuantity(333.3, 'g')).toBe('335');
    expect(formatQuantity(47.6, 'ml')).toBe('48');
    expect(formatQuantity(1.234, 'kg')).toBe('1,23');
  });
  it('redondea a decimal cuando la fracción no es "bonita"', () => {
    expect(formatQuantity(1.9, 'taza')).toBe('2');
    expect(formatQuantity(0.4, 'taza')).toBe('0,4');
  });
  it('devuelve cadena vacía para valores no válidos', () => {
    expect(formatQuantity(0, 'g')).toBe('');
    expect(formatQuantity(Number.NaN, 'g')).toBe('');
  });
});

describe('unitLabel', () => {
  it('pluraliza unidades contables', () => {
    expect(unitLabel('taza', 1)).toBe('taza');
    expect(unitLabel('taza', 2)).toBe('tazas');
    expect(unitLabel('g', 500)).toBe('g');
    expect(unitLabel(null, 2)).toBe('');
  });
});

describe('describeIngredient', () => {
  it('usa "de" salvo para piezas enteras', () => {
    expect(describeIngredient('arroz', '2 tazas', 'taza')).toBe('2 tazas de arroz');
    expect(describeIngredient('aguacate', '2 unidades', 'unidad')).toBe('2 aguacate');
    expect(describeIngredient('sal', '', null, 'al gusto')).toBe('sal (al gusto)');
  });
});

describe('scaleIngredient(s)', () => {
  it('escala y formatea manteniendo los "al gusto"', () => {
    const scaled = scaleIngredients(
      [
        { name: 'garbanzos cocidos', quantity: 400, unit: 'g', note: 'escurridos' },
        { name: 'aceite de oliva', quantity: 2, unit: 'cucharada' },
        { name: 'sal', quantity: null, unit: null, note: 'al gusto' },
      ],
      4,
      2,
    );
    expect(scaled[0].scaledQuantity).toBe(200);
    expect(scaled[0].display).toBe('200 g de garbanzos cocidos (escurridos)');
    expect(scaled[1].display).toBe('1 cucharada de aceite de oliva');
    expect(scaled[2].scaledQuantity).toBeNull();
    expect(scaled[2].display).toBe('sal (al gusto)');
  });
  it('duplicar porciones duplica cantidades', () => {
    const s = scaleIngredient({ name: 'tofu', quantity: 250, unit: 'g' }, 2, 4);
    expect(s.amount).toBe('500 g');
  });
});
