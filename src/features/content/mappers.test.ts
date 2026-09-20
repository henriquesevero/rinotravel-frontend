import {
  fromMoney,
  mergeLocation,
  splitList,
  toLocationInput,
  toMoneyInput,
  toOptionalInt,
} from './mappers';

describe('locations', () => {
  it('treats empty text as no location, which the API expects as null', () => {
    expect(toLocationInput('  ', '')).toBeNull();
    expect(toLocationInput('Torre', '')).toEqual({ name: 'Torre' });
  });

  it('keeps coordinates only while the text still matches what they were found for', () => {
    const found = { name: 'Torre', address: 'Minato', latitude: 35.65, longitude: 139.74 };
    expect(mergeLocation('Torre', 'Minato', found)).toEqual(found);
    expect(mergeLocation('Outra', 'Minato', found)).toEqual({ name: 'Outra', address: 'Minato' });
    expect(mergeLocation('', '', found)).toBeNull();
  });
});

describe('form value mapping', () => {
  it('turns money text into minor units and back', () => {
    expect(toMoneyInput('12,5', 'BRL')).toEqual({ amount: 1250, currency: 'BRL' });
    expect(toMoneyInput('', 'BRL')).toBeNull();
    expect(fromMoney({ amount: 1250, currency: 'BRL' })).toBe('12,50');
    expect(fromMoney(undefined)).toBe('');
  });

  it('maps optional integers and lists', () => {
    expect(toOptionalInt('')).toBeNull();
    expect(toOptionalInt('90')).toBe(90);
    expect(splitList(' ramen , , gyoza,')).toEqual(['ramen', 'gyoza']);
  });
});
