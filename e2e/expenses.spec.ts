import { expect, test } from '@playwright/test';

import {
  API,
  addMemberViaApi,
  collectBrowserErrors,
  createTripViaApi,
  registerViaApi,
  signInToDashboard,
} from './support';

const usdTrip = { currency: 'USD', timezone: 'America/New_York', destination: 'Nova York' };

test.describe('expenses', () => {
  test('a shopping list hangs off the shop it is bought in, and the budget follows it', async ({
    page,
    request,
  }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, usdTrip);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const made = await request.post(`${API}/api/v1/trips/${trip.id}/places`, {
      headers,
      data: { name: 'Nintendo Store', category: 'SHOPPING', priority: 'HIGH' },
    });
    expect(made.status(), await made.text()).toBe(201);
    const shop = (await made.json()).id as string;

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/expenses`);
    await expect(page.getByText('Nenhum gasto ainda')).toBeVisible();

    // A budget for the trip and a limit for meals.
    await page.getByTestId('edit-budget').click();
    await page.getByTestId('budget-total').fill('2000');
    await page.getByTestId('budget-FOOD').fill('20');
    await page.getByTestId('budget-sheet-submit').click();
    await expect(page.getByTestId('expense-forecast')).toContainText('0,00');
    await expect(page.getByTestId('expense-forecast')).toContainText('2.000,00');

    // Something to buy at the shop: an estimate, tied to the shop.
    await page.getByTestId('add-expense').first().click();
    await page.getByTestId('expense-name').fill('Switch OLED');
    await page.getByTestId('expense-category').click();
    await page.getByTestId('expense-category-option-ELECTRONICS').click();
    await page.getByTestId('expense-estimate').fill('349,99');
    await page.getByTestId('expense-link-pick').click();
    await page.getByTestId(`link-place:${shop}`).click();
    await expect(page.getByTestId('expense-link')).toContainText('Nintendo Store');
    await page.getByTestId('expense-sheet-submit').click();

    await page.getByTestId('add-expense').first().click();
    await page.getByTestId('expense-name').fill('Mario Kart');
    await page.getByTestId('expense-category').click();
    await page.getByTestId('expense-category-option-ELECTRONICS').click();
    await page.getByTestId('expense-estimate').fill('59,99');
    await page.getByTestId('expense-link-pick').click();
    await page.getByTestId(`link-place:${shop}`).click();
    await page.getByTestId('expense-sheet-submit').click();

    // A meal already paid, with no place.
    await page.getByTestId('add-expense').first().click();
    await page.getByTestId('expense-name').fill('Almoço');
    await page.getByTestId('expense-category').click();
    await page.getByTestId('expense-category-option-FOOD').click();
    await page.getByTestId('expense-status').click();
    await page.getByTestId('expense-status-option-PAID').click();
    await page.getByTestId('expense-actual').fill('25,50');
    await page.getByTestId('expense-sheet-submit').click();

    // Planned is what is still to buy; paid is what is gone.
    await expect(page.getByTestId('figure-planned')).toContainText('409,98');
    await expect(page.getByTestId('figure-spent')).toContainText('25,50');
    await expect(page.getByTestId('expense-forecast')).toContainText('435,48');
    await expect(page.getByTestId('figure-remaining')).toContainText('1.564,52');
    // The meal went past its limit of 20.
    await expect(page.getByTestId('category-FOOD')).toContainText('Acima do limite');

    // By place: the shop holds both things to buy.
    await page.getByTestId('expense-views').getByText('Locais', { exact: true }).click();
    const group = page.getByTestId(`place-group-place:${shop}`);
    await expect(group).toContainText('Nintendo Store');
    await expect(group).toContainText('Switch OLED');
    await expect(group).toContainText('Mario Kart');
    await expect(group).toContainText('409,98');
    await expect(page.getByTestId('place-group-none')).toContainText('Almoço');

    // Buying one: one tap turns the estimate into what was paid.
    const switchRow = page
      .locator('[data-testid^="expense-"]')
      .filter({ hasText: 'Switch OLED' })
      .first();
    await switchRow.locator('[data-testid^="toggle-expense-"]').click();
    await expect(page.getByTestId('figure-spent')).toContainText('375,49');
    await expect(page.getByTestId('figure-planned')).toContainText('59,99');

    // The API holds it as one purchase per line, with the link.
    const list = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/expenses`, { headers })).json()
    ).items as { name: string; status: string; link?: { type: string; id: string } }[];
    expect(list).toHaveLength(3);
    expect(list.find((e) => e.name === 'Switch OLED')).toMatchObject({
      status: 'PAID',
      link: { type: 'place', id: shop },
    });
    expect(errors).toEqual([]);
  });

  test('from a place, a purchase is added with that place already chosen', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, usdTrip);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const shop = (
      await (
        await request.post(`${API}/api/v1/trips/${trip.id}/places`, {
          headers,
          data: { name: 'Pokémon Center', category: 'SHOPPING', priority: 'MEDIUM' },
        })
      ).json()
    ).id as string;
    await request.post(`${API}/api/v1/trips/${trip.id}/expenses`, {
      headers,
      data: {
        name: 'Pelúcia do Pikachu',
        category: 'SOUVENIRS',
        estimate: { amount: 2499, currency: 'USD' },
        link: { type: 'place', id: shop },
      },
    });

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/places`);
    await page.getByText('Pokémon Center', { exact: true }).click();
    const box = page.getByTestId('linked-expenses');
    await expect(box).toContainText('Pelúcia do Pikachu');
    await expect(box).toContainText('24,99');

    await page.getByTestId('linked-expense-add').click();
    await expect(page.getByTestId('expense-link')).toContainText('Pokémon Center');
    await page.getByTestId('expense-name').fill('Cartas');
    await page.getByTestId('expense-estimate').fill('12');
    await page.getByTestId('expense-sheet-submit').click();
    await expect(page.getByText('Cartas', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/expenses$/);

    // The overview shows the trip's money at a glance.
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByTestId('budget-glance')).toContainText('36,99');
  });

  test('a viewer sees the money but cannot change it', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana, usdTrip);
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');
    const headers = { Authorization: `Bearer ${ana.token}` };
    await request.post(`${API}/api/v1/trips/${trip.id}/expenses`, {
      headers,
      data: { name: 'Jaqueta', category: 'CLOTHES', estimate: { amount: 8000, currency: 'USD' } },
    });

    await signInToDashboard(page, bia);
    await page.goto(`/trips/${trip.id}/expenses`);
    await expect(page.getByText('Jaqueta', { exact: true })).toBeVisible();
    await expect(page.getByTestId('add-expense')).toHaveCount(0);
    await expect(page.getByTestId('edit-budget')).toHaveCount(0);
    await expect(page.locator('[data-testid^="toggle-expense-"]')).toHaveCount(0);
  });
});
