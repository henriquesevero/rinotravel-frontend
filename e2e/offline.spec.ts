import { expect, test } from '@playwright/test';

import { createTripViaApi, registerViaApi, signInToDashboard } from './support';

test.describe('offline viewing', () => {
  test('a trip already open stays readable when the connection drops mid-session', async ({
    page,
    request,
    context,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, { name: 'Vista antes' });

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByRole('heading', { name: 'Vista antes' })).toBeVisible();
    await expect(page.getByTestId('offline-banner')).toHaveCount(0);

    // The connection drops while the app keeps running (no reload): what was already on screen,
    // and whatever else was fetched before, keeps reading from the cache instead of erroring out.
    await context.setOffline(true);
    await page.getByTestId('nav-overview').click();
    await expect(page.getByRole('heading', { name: 'Vista antes' })).toBeVisible();
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByTestId('offline-banner')).toHaveCount(0);
  });
});
