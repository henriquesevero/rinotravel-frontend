import { expect, test } from '@playwright/test';

import {
  API,
  addMemberViaApi,
  collectBrowserErrors,
  createItemViaApi,
  createTripViaApi,
  isPhone,
  registerViaApi,
  signInToDashboard,
  todayInSaoPaulo,
} from './support';

const confirmDelete = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Excluir', exact: true }).last().click();

test.describe('trip content', () => {
  test('itinerary: an item is created, edited and deleted', async ({ page, request }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    await expect(page.getByRole('heading', { name: 'Roteiro', exact: true })).toBeVisible();

    await page.getByTestId('add-item').click();
    await page.getByTestId('item-title').fill('Templo Senso-ji');
    await page.getByTestId('item-start').fill('0930');
    await page.getByTestId('item-sheet-submit').click();

    const day = page.getByTestId('day-2027-04-01');
    await expect(day).toContainText('Templo Senso-ji');
    await expect(day).toContainText('09:30');

    await day.getByText('Templo Senso-ji').click();
    await page.getByTestId('item-title').fill('Senso-ji e Nakamise');
    await page.getByTestId('item-sheet-submit').click();
    await expect(day).toContainText('Senso-ji e Nakamise');

    await day.getByText('Senso-ji e Nakamise').click();
    await page.getByTestId('item-sheet-delete').click();
    await confirmDelete(page);
    await expect(page.getByText('Seu roteiro está vazio')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('places: a wishlist place is scheduled into the itinerary', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/places`);

    await page.getByTestId('add-place').click();
    await page.getByTestId('place-name').fill('Torre de Tóquio');
    await page.getByTestId('place-sheet-submit').click();
    await expect(page.getByText('Torre de Tóquio')).toBeVisible();

    await page.getByRole('button', { name: 'Agendar no roteiro' }).click();
    await page.getByTestId('schedule-time').fill('1800');
    await page.getByTestId('schedule-sheet-submit').click();
    await expect(page.getByTestId('schedule-sheet-submit')).toHaveCount(0);

    await page.goto(`/trips/${trip.id}/itinerary`);
    const day = page.getByTestId('day-2027-04-01');
    await expect(day).toContainText('Torre de Tóquio');
    await expect(day).toContainText('18:00');
  });

  test('places: search says so when Google is not configured, and restaurants save', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/places`);

    await page.getByTestId('places-tabs-restaurants').click();
    await page.getByTestId('add-place').click();
    await page.getByTestId('restaurant-search').fill('sushi zanmai');
    await expect(page.getByText('A busca de lugares não está disponível')).toBeVisible();

    await page.getByTestId('restaurant-name').fill('Sushi Zanmai');
    await page.getByTestId('restaurant-sheet-submit').click();
    await expect(page.getByText('Sushi Zanmai')).toBeVisible();
    await expect(page.getByText('Quero ir').filter({ visible: true }).first()).toBeVisible();
  });

  test('bookings: flight duration respects time zones and bad times are refused', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/bookings`);

    await page.getByTestId('add-booking').click();
    await page.getByTestId('flight-number').fill('la 8084');
    await page.getByTestId('flight-from').fill('gru');
    await page.getByTestId('flight-to').fill('nrt');
    await page.getByTestId('flight-dep-date').fill('2027-04-01');
    await page.getByTestId('flight-dep-time').fill('2210');
    await page.getByTestId('flight-arr-date').fill('2027-04-01');
    await page.getByTestId('flight-arr-time').fill('0630');
    await page.getByTestId('flight-sheet-submit').click();
    await expect(page.getByText('A chegada não pode ser antes da partida')).toBeVisible();

    // 22:10 in São Paulo is 10:10 the next day in Tokyo: landing 06:30 on the 3rd is a 20 h 20 flight.
    await page.getByTestId('flight-arr-date').fill('2027-04-03');
    await page.getByTestId('flight-sheet-submit').click();
    const flight = page.getByText('GRU → NRT · LA8084');
    await expect(flight).toBeVisible();
    await expect(page.getByText(/20 h 20/)).toBeVisible();
  });

  test('bookings: a hotel shows its nights and lands on the itinerary', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/bookings`);

    await page.getByTestId('bookings-tabs-hotels').click();
    await page.getByTestId('add-booking').click();
    await page.getByTestId('hotel-name').fill('Hotel Sakura');
    await page.getByTestId('hotel-in-date').fill('2027-04-03');
    await page.getByTestId('hotel-out-date').fill('2027-04-07');
    await page.getByTestId('hotel-sheet-submit').click();
    await expect(page.getByText(/4 noites/)).toBeVisible();

    await page.goto(`/trips/${trip.id}/itinerary`);
    await expect(page.getByTestId('day-2027-04-03')).toContainText('Hotel Sakura');
  });

  test('transfers: a transfer is saved and opens with its embedded route map', async ({
    page,
    request,
    context,
  }) => {
    const errors = collectBrowserErrors(page);
    // The bundle carries a fake embed key: answer Google's embed page ourselves and keep the address.
    const embedded: string[] = [];
    await context.route('https://www.google.com/maps/embed/**', async (route) => {
      embedded.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' });
    });

    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/transfers`);

    await page.getByTestId('add-transfer').click();
    await page.getByTestId('transfer-origin').fill('Aeroporto de Narita');
    await page.getByTestId('transfer-destination').fill('Hotel Sakura');

    // Saving opens the transfer, so the map is the first thing seen.
    await page.getByTestId('transfer-sheet-submit').click();
    const detail = page.getByTestId('transfer-detail');
    await expect(detail).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Aeroporto de Narita → Hotel Sakura' }),
    ).toBeVisible();
    await expect(detail.getByText('Metrô').first()).toBeVisible();

    const map = page.locator('iframe[title="Mapa da rota"]');
    await expect(map).toBeVisible();
    await expect.poll(() => embedded.length).toBeGreaterThan(0);
    const url = new URL(embedded[0] ?? '');
    expect(url.pathname).toBe('/maps/embed/v1/directions');
    expect(url.searchParams.get('key')).toBe('e2e-fake-embed-key');
    expect(url.searchParams.get('origin')).toBe('Aeroporto de Narita');
    expect(url.searchParams.get('destination')).toBe('Hotel Sakura');
    expect(url.searchParams.get('mode')).toBe('transit');
    // A blocked frame (CSP) or any other browser problem would show up here.
    expect(errors).toEqual([]);
  });

  test('transfers: route suggestions degrade gracefully without a Google key', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/transfers`);

    await page.getByTestId('add-transfer').click();
    await page.getByTestId('transfer-origin').fill('Aeroporto de Narita');
    await page.getByTestId('transfer-destination').fill('Hotel Sakura');
    await page.getByTestId('suggest-routes').click();
    await expect(page.getByText('As rotas automáticas não estão disponíveis')).toBeVisible();
  });

  test('transfers: the route opens in the maps app with origin, destination and mode filled in', async ({
    page,
    request,
    context,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    const created = await request.post(`${API}/api/v1/trips/${trip.id}/transfers`, {
      headers: { Authorization: `Bearer ${ana.token}` },
      data: {
        origin: { name: 'Aeroporto de Narita' },
        destination: { name: 'Hotel Sakura', address: 'Asakusa, Tokyo' },
        legs: [
          {
            mode: 'TRAIN',
            line: 'Skyliner',
            origin: { name: 'Aeroporto de Narita' },
            destination: { name: 'Ueno' },
          },
          { mode: 'WALKING', origin: { name: 'Ueno' }, destination: { name: 'Hotel Sakura' } },
        ],
      },
    });
    expect(created.status(), await created.text()).toBe(201);

    // Opening a maps link starts a navigation to google.com; record it instead of going there.
    const opened: string[] = [];
    await context.route('https://www.google.com/**', async (route) => {
      opened.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' });
    });

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/transfers`);
    await page.getByText('Aeroporto de Narita → Hotel Sakura').click();
    await expect(page.getByTestId('transfer-detail')).toBeVisible();
    await expect(page.getByText('Skyliner').first()).toBeVisible();

    await page.getByTestId('open-google-maps').click();
    // The embedded map also asks google.com for its page; only the directions link matters here.
    await expect.poll(() => opened.some((address) => address.includes('/maps/dir/'))).toBe(true);
    const url = new URL(opened.find((address) => address.includes('/maps/dir/')) ?? '');
    expect(url.pathname).toBe('/maps/dir/');
    expect(url.searchParams.get('origin')).toBe('Aeroporto de Narita');
    expect(url.searchParams.get('destination')).toBe('Asakusa, Tokyo');
    expect(url.searchParams.get('travelmode')).toBe('transit');
    await expect(page.getByTestId('share-transfer')).toBeVisible();
  });

  test('transfers: a viewer can open the map but not edit', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');
    const created = await request.post(`${API}/api/v1/trips/${trip.id}/transfers`, {
      headers: { Authorization: `Bearer ${ana.token}` },
      data: {
        origin: { name: 'Shinjuku' },
        destination: { name: 'Shibuya' },
        legs: [{ mode: 'SUBWAY', origin: { name: 'Shinjuku' }, destination: { name: 'Shibuya' } }],
      },
    });
    expect(created.status()).toBe(201);

    await signInToDashboard(page, bia);
    await page.goto(`/trips/${trip.id}/transfers`);
    await page.getByText('Shinjuku → Shibuya').click();
    await expect(page.getByTestId('open-google-maps')).toBeVisible();
    await expect(page.getByTestId('transfer-edit')).toHaveCount(0);
  });

  test('documents: a file is uploaded to MongoDB storage and comes back identical', async ({
    page,
    request,
  }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/documents`);

    const content = '%PDF-1.4\n% rhino travel e2e document\n%%EOF\n';
    await page.getByTestId('add-document').click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('document-pick').click();
    await (
      await chooser
    ).setFiles({
      name: 'passagem.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(content),
    });
    await expect(page.getByTestId('document-name')).toHaveValue('passagem');
    await page.getByTestId('document-sheet-submit').click();

    await expect(page.getByText('passagem', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir', exact: true })).toBeVisible();

    const headers = { Authorization: `Bearer ${ana.token}` };
    const list = await (
      await request.get(`${API}/api/v1/trips/${trip.id}/documents`, { headers })
    ).json();
    expect(list.items).toHaveLength(1);
    expect(list.items[0].status).toBe('READY');
    const link = await (
      await request.get(`${API}/api/v1/trips/${trip.id}/documents/${list.items[0].id}/download`, {
        headers,
      })
    ).json();
    const file = await request.get(link.download.url);
    expect(file.status()).toBe(200);
    expect(await file.text()).toBe(content);
    expect(errors).toEqual([]);
  });

  test('documents: a file that is not allowed is refused before any upload', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/documents`);

    await page.getByTestId('add-document').click();
    await page.getByTestId('document-name').fill('script');
    await page.getByTestId('document-sheet-submit').click();
    await expect(page.getByText('Escolha um arquivo')).toBeVisible();
  });

  test('dashboard: the trip under way leads, with today’s agenda', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana, {
      name: 'Rio agora',
      destination: 'Rio de Janeiro',
      startDate: todayInSaoPaulo(-1),
      endDate: todayInSaoPaulo(4),
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    });
    await createItemViaApi(request, ana, trip.id, {
      date: todayInSaoPaulo(),
      title: 'Almoço no Arpoador',
      time: '23:30',
      timezone: 'America/Sao_Paulo',
    });

    await signInToDashboard(page, ana);
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
    const focus = page.getByTestId('focus-trip');
    await expect(focus).toContainText('Rio agora');
    await expect(focus).toContainText(/viagem em andamento/i);
    await expect(focus).toContainText('Dia 2 de 6');
    await expect(page.getByTestId('agenda')).toContainText('Almoço no Arpoador');
    await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toBeVisible();

    await page.getByTestId('open-focus-trip').click();
    await expect(page).toHaveURL(new RegExp(`/trips/${trip.id}$`));
    // The dashboard stays mounted underneath the pushed screen, so take the top-most tile.
    await expect(page.getByTestId('stat-days').last()).toContainText('1');
  });

  test('a viewer sees the content but cannot change it', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');
    await createItemViaApi(request, ana, trip.id, {
      date: '2027-04-02',
      title: 'Jantar de boas-vindas',
      timezone: 'Asia/Tokyo',
    });

    await signInToDashboard(page, bia);
    await page.goto(`/trips/${trip.id}/itinerary`);
    await expect(page.getByText('acesso somente para leitura')).toBeVisible();
    await expect(page.getByTestId('day-2027-04-02')).toContainText('Jantar de boas-vindas');
    await expect(page.getByTestId('add-item')).toHaveCount(0);
    await expect(page.getByTestId('add-item-2027-04-02')).toHaveCount(0);

    await page.goto(`/trips/${trip.id}/documents`);
    await expect(page.getByTestId('add-document')).toHaveCount(0);
  });

  test('navigation reaches every section from the sidebar or the phone menu', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}`);
    await expect(page.getByRole('heading', { name: 'Japão 2027' })).toBeVisible();

    const sections: [string, string][] = [
      ['itinerary', 'Roteiro'],
      ['places', 'Lugares'],
      ['bookings', 'Reservas'],
      ['transfers', 'Deslocamentos'],
      ['documents', 'Documentos'],
      ['members', 'Membros'],
    ];
    const overflow = new Set(['transfers', 'documents', 'members']);
    for (const [key, heading] of sections) {
      if (isPhone(page) && overflow.has(key)) {
        await page.getByTestId('nav-more').click();
        await page.getByTestId(`more-${key}`).click();
      } else {
        await page.getByTestId(`nav-${key}`).click();
      }
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
  });
});
