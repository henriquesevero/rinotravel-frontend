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

    // The dashboard shows the trip's money at a glance; the trip's own overview no longer does.
    await page.goto('/');
    await expect(page.getByTestId('budget-glance')).toContainText('36,99');
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByTestId('budget-glance')).toHaveCount(0);
  });

  test('everything with a price in the trip adds up in the expenses on its own', async ({
    page,
    request,
  }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, usdTrip);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const base = `${API}/api/v1/trips/${trip.id}`;
    const post = async (path: string, data: unknown) => {
      const response = await request.post(`${base}${path}`, { headers, data });
      expect(response.status(), await response.text()).toBe(201);
      return (await response.json()) as { id: string };
    };
    const usd = (amount: number) => ({ amount, currency: 'USD' });
    const at = (date: string, time: string) => ({
      dateTime: `${date}T${time}:00`,
      timezone: 'America/New_York',
    });

    const day = await post('/itinerary-days', { date: '2027-04-05' });
    await post('/itinerary-items', {
      dayId: day.id,
      title: 'Passeio de barco',
      category: 'ATTRACTION',
      estimatedCost: usd(4500),
    });
    await post('/restaurants', {
      name: 'Katz Deli',
      status: 'RESERVED',
      estimatedCost: usd(3000),
      reservationAt: at('2027-04-05', '13:00'),
    });
    await post('/restaurants', {
      name: 'Quero conhecer',
      status: 'WISHLIST',
      estimatedCost: usd(9900),
    });
    const ticket = await post('/tickets', {
      name: 'Hamilton',
      kind: 'SHOW',
      cost: usd(30000),
      start: at('2027-04-06', '19:00'),
    });
    await post('/flights', {
      flightNumber: 'LA8180',
      departureAirport: 'GRU',
      arrivalAirport: 'JFK',
      departure: { dateTime: '2027-04-01T22:50', timezone: 'America/Sao_Paulo' },
      arrival: { dateTime: '2027-04-02T06:45', timezone: 'America/New_York' },
      cost: usd(90000),
    });
    await post('/hotels', {
      name: 'Park Hyatt',
      checkIn: at('2027-04-02', '15:00'),
      checkOut: at('2027-04-05', '11:00'),
      cost: usd(180000),
    });

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/expenses`);

    // Nothing was typed into the expenses, yet the trip's prices are all here, still to spend. The
    // wishlist restaurant is only an idea, so it is left out.
    await expect(page.getByTestId('expense-auto-note')).toBeVisible();
    await expect(page.getByTestId('figure-planned')).toContainText('3.075,00');
    await expect(page.getByTestId('figure-spent')).toContainText('0,00');
    await expect(page.getByTestId('category-FOOD')).toContainText('Katz Deli');
    await expect(page.getByTestId('category-FOOD')).not.toContainText('Quero conhecer');
    await expect(page.getByTestId('category-ACTIVITIES')).toContainText('Hamilton');
    await expect(page.getByTestId('category-ACTIVITIES')).toContainText('Passeio de barco');
    await expect(page.getByTestId('category-TRANSPORT')).toContainText('LA8180');
    await expect(page.getByTestId('category-LODGING')).toContainText('Park Hyatt');
    // Each of them can be ticked as paid too, and a click on the row leads to the record it comes from.
    await expect(page.locator('[data-testid^="toggle-expense-auto:"]')).toHaveCount(5);

    // Changing the price of the ticket changes the expenses, and skipping it takes it out.
    const patch = async (version: number, data: unknown) => {
      const response = await request.patch(`${base}/tickets/${ticket.id}`, {
        headers,
        data: { baseVersion: version, ...(data as object) },
      });
      expect(response.status(), await response.text()).toBe(200);
    };
    await patch(1, { cost: usd(10000) });
    await page.reload();
    await expect(page.getByTestId('figure-planned')).toContainText('2.875,00');
    await patch(2, { status: 'SKIPPED' });
    await page.reload();
    await expect(page.getByTestId('figure-planned')).toContainText('2.775,00');

    // A line leads to the record it comes from.
    await page.getByTestId('category-LODGING').getByText('Park Hyatt').click();
    await expect(page).toHaveURL(/\/bookings$/);
    expect(errors).toEqual([]);
  });

  test('a price already paid is marked with one tap, or a whole category and the whole trip at once', async ({
    page,
    request,
  }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, usdTrip);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const base = `${API}/api/v1/trips/${trip.id}`;
    const post = async (path: string, data: unknown) => {
      const response = await request.post(`${base}${path}`, { headers, data });
      expect(response.status(), await response.text()).toBe(201);
      return (await response.json()) as { id: string };
    };
    const usd = (amount: number) => ({ amount, currency: 'USD' });
    const at = (date: string, time: string) => ({
      dateTime: `${date}T${time}:00`,
      timezone: 'America/New_York',
    });
    const day = await post('/itinerary-days', { date: '2027-04-05' });
    await post('/itinerary-items', {
      dayId: day.id,
      title: 'Passeio de barco',
      category: 'ATTRACTION',
      estimatedCost: usd(4500),
    });
    const ticket = await post('/tickets', {
      name: 'Hamilton',
      cost: usd(30000),
      start: at('2027-04-06', '19:00'),
    });
    const hotel = await post('/hotels', {
      name: 'Park Hyatt',
      checkIn: at('2027-04-08', '15:00'),
      checkOut: at('2027-04-10', '11:00'),
      cost: usd(180000),
    });
    const switchOled = await post('/expenses', {
      name: 'Switch OLED',
      category: 'ELECTRONICS',
      estimate: usd(10000),
    });
    const confirm = () =>
      page.getByRole('button', { name: 'Marcar como pago', exact: true }).last().click();
    const payments = async () =>
      (
        (await (await request.get(`${base}/payments`, { headers })).json()) as {
          items: { link: { type: string; id: string }; paid: boolean }[];
        }
      ).items;

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/expenses`);
    // Everything is still to buy: nothing has happened yet.
    await expect(page.getByTestId('figure-planned')).toContainText('2.245,00');
    await expect(page.getByTestId('figure-spent')).toContainText('0,00');

    // One tap on a ticket that was already bought.
    await page.getByTestId(`toggle-expense-auto:ticket:${ticket.id}`).click();
    await expect(page.getByTestId('figure-spent')).toContainText('300,00');
    await expect(page.getByTestId('figure-planned')).toContainText('1.945,00');
    expect(await payments()).toEqual([
      expect.objectContaining({ link: { type: 'ticket', id: ticket.id }, paid: true }),
    ]);

    // A whole category: the other tour is bought too.
    await page.getByTestId('mark-all-ACTIVITIES').click();
    await confirm();
    await expect(page.getByTestId('figure-spent')).toContainText('345,00');
    await expect(page.getByTestId('mark-all-ACTIVITIES')).toHaveCount(0);

    // The whole trip: the stay and the shopping are paid as well.
    await page.getByTestId('mark-all').click();
    await confirm();
    await expect(page.getByTestId('figure-planned')).toContainText('0,00');
    await expect(page.getByTestId('figure-spent')).toContainText('2.245,00');
    await expect(page.getByTestId('mark-all')).toHaveCount(0);
    const list = (
      (await (await request.get(`${base}/expenses`, { headers })).json()) as {
        items: { id: string; status: string }[];
      }
    ).items;
    expect(list.find((e) => e.id === switchOled.id)?.status).toBe('PAID');

    // Unticking the stay goes back to what its date says (not yet), so its mark is dropped.
    const marks = (await payments()).length;
    await page.getByTestId(`toggle-expense-auto:hotel:${hotel.id}`).click();
    await expect(page.getByTestId('figure-planned')).toContainText('1.800,00');
    await expect.poll(async () => (await payments()).length).toBe(marks - 1);
    expect(errors).toEqual([]);
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
