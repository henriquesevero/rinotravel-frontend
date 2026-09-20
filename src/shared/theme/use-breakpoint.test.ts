import { breakpointFor } from './use-breakpoint';

describe('breakpointFor', () => {
  it.each([
    [320, 'compact'],
    [767, 'compact'],
    [768, 'medium'],
    [1023, 'medium'],
    [1024, 'expanded'],
    [1920, 'expanded'],
  ] as const)('%ipx is %s', (width, expected) => {
    expect(breakpointFor(width)).toBe(expected);
  });
});
