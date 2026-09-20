import { Share } from 'react-native';

import { shareText } from './share';

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(globalThis, 'navigator');
});

function withClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { clipboard: { writeText } },
    configurable: true,
  });
}

describe('shareText', () => {
  it('reports a completed share', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    await expect(shareText('a → b')).resolves.toBe('shared');
  });

  it('reports a dismissed share sheet without copying anything', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    withClipboard(writeText);
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
    await expect(shareText('a → b')).resolves.toBe('dismissed');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the text when the platform has no share sheet', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    withClipboard(writeText);
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('Share is not supported'));
    await expect(shareText('a → b')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('a → b');
  });

  it('fails cleanly when neither sharing nor copying is possible', async () => {
    withClipboard(() => Promise.reject(new Error('denied')));
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('nope'));
    await expect(shareText('a → b')).resolves.toBe('failed');
  });
});
