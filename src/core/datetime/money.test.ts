import { formatMoney, minorToInput, parseMoneyInput, sumMoney } from './money';

describe('parseMoneyInput', () => {
  it.each([
    ['80', 'BRL', 8000],
    ['80,5', 'BRL', 8050],
    ['80.50', 'BRL', 8050],
    ['1.234,50', 'BRL', 123450],
    ['1,234.50', 'USD', 123450],
    ['1.234', 'BRL', 123400],
    ['2500', 'JPY', 2500],
    ['1.500', 'JPY', 1500],
    [' 12 ', 'EUR', 1200],
  ])('%p in %s is %i minor units', (text, currency, expected) => {
    expect(parseMoneyInput(text, currency)).toBe(expected);
  });

  it.each([[''], ['abc'], ['-5'], ['1,2,3x'], [',50']])('rejects %p', (text) => {
    expect(parseMoneyInput(text, 'BRL')).toBeNull();
  });
});

describe('money formatting', () => {
  it('reads minor units back into an editable string', () => {
    expect(minorToInput(123450, 'BRL')).toBe('1234,50');
    expect(minorToInput(2500, 'JPY')).toBe('2500');
  });

  it('formats yen without decimals and reais with them', () => {
    expect(formatMoney(2500, 'JPY', 'pt-BR').replace(/\s/g, ' ')).toContain('2.500');
    expect(formatMoney(2500, 'BRL', 'pt-BR')).toContain('25,00');
  });

  it('only sums the requested currency', () => {
    expect(
      sumMoney(
        [
          { amount: 100, currency: 'BRL' },
          { amount: 50, currency: 'JPY' },
          null,
          { amount: 25, currency: 'BRL' },
        ],
        'BRL',
      ),
    ).toBe(125);
  });
});
