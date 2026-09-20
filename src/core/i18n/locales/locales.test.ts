import { en } from './en';
import { ptBR } from './pt-BR';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  if (typeof value !== 'object' || value === null) return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (all, [key, child]) => ({ ...all, ...flatten(child, prefix ? `${prefix}.${key}` : key) }),
    {},
  );
}

const variables = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe('translations', () => {
  const pt = flatten(ptBR);
  const english = flatten(en);

  it('define the same keys in both languages', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(pt).sort());
  });

  it('use the same interpolation variables in both languages', () => {
    for (const [key, text] of Object.entries(pt)) {
      expect({ key, vars: variables(english[key] ?? '') }).toEqual({ key, vars: variables(text) });
    }
  });

  it('leave no message empty', () => {
    for (const [key, text] of [...Object.entries(pt), ...Object.entries(english)]) {
      expect({ key, empty: text.trim() === '' }).toEqual({ key, empty: false });
    }
  });
});
