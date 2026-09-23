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

    // Clicking an item shows it first; editing is one tap further.
    await day.getByText('Templo Senso-ji').click();
    await expect(page.getByTestId('item-detail')).toBeVisible();
    await page.getByTestId('item-detail-edit').click();
    await page.getByTestId('item-title').fill('Senso-ji e Nakamise');
    await page.getByTestId('item-sheet-submit').click();
    await expect(day).toContainText('Senso-ji e Nakamise');

    await day.getByText('Senso-ji e Nakamise').click();
    await page.getByTestId('item-detail-edit').click();
    await page.getByTestId('item-sheet-delete').click();
    await confirmDelete(page);
    await expect(page.getByText('Seu roteiro está vazio')).toBeVisible();
    expect(errors).toEqual([]);
  });

  const PIN = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  test('itinerary: an item opens to a view with its map before any editing', async ({
    page,
    request,
  }) => {
    const pins: Record<string, unknown>[] = [];
    await page.route('**/api/v1/trips/*/maps/location', async (route) => {
      pins.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'image/png', body: PIN });
    });
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');
    const headers = { Authorization: `Bearer ${ana.token}` };
    const day = await (
      await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-days`, {
        headers,
        data: { date: '2027-04-02' },
      })
    ).json();
    const made = await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-items`, {
      headers,
      data: {
        dayId: day.id,
        title: 'Torre de Tóquio',
        category: 'ATTRACTION',
        location: {
          name: 'Torre de Tóquio',
          address: 'Minato, Tóquio',
          latitude: 35.6586,
          longitude: 139.7454,
        },
        estimatedCost: { amount: 1200, currency: 'JPY' },
        notes: 'Chegar antes do pôr do sol',
      },
    });
    expect(made.status(), await made.text()).toBe(201);

    // The writer sees the item, its map and an edit shortcut.
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    await page.getByTestId('day-2027-04-02').getByText('Torre de Tóquio').click();
    const detail = page.getByTestId('item-detail');
    await expect(detail).toContainText('Minato, Tóquio');
    await expect(detail).toContainText('Chegar antes do pôr do sol');
    await expect(detail.getByTestId('location-map')).toBeVisible();
    expect(pins.at(-1)).toMatchObject({ location: { name: 'Torre de Tóquio', latitude: 35.6586 } });
    await expect(page.getByTestId('open-google-maps')).toBeVisible();
    await page.getByTestId('item-detail-edit').click();
    await expect(page.getByTestId('item-title')).toHaveValue('Torre de Tóquio');
  });

  test('itinerary: a viewer opens the view but has no way to edit', async ({ page, request }) => {
    await page.route('**/api/v1/trips/*/maps/location', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PIN }),
    );
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
    await page.getByTestId('day-2027-04-02').getByText('Jantar de boas-vindas').click();
    await expect(page.getByTestId('item-detail')).toBeVisible();
    await expect(page.getByTestId('item-detail-edit')).toHaveCount(0);
  });

  test('places: picking a Google suggestion draws its map in the form and in the view', async ({
    page,
    request,
  }) => {
    const pins: Record<string, unknown>[] = [];
    await page.route('**/api/v1/places/search*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              providerId: 'p1',
              name: 'Torre de Tóquio',
              address: 'Minato, Tóquio, Japão',
              latitude: 35.6586,
              longitude: 139.7454,
              types: [],
            },
          ],
        }),
      }),
    );
    await page.route('**/api/v1/trips/*/maps/location', async (route) => {
      pins.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'image/png', body: PIN });
    });
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/places`);

    await page.getByTestId('add-place').click();
    await page.getByTestId('place-search').fill('Torre');
    await page
      .getByRole('button', { name: /Torre de Tóquio/ })
      .first()
      .click();
    // A place chosen from Google is exact, so the map needs no extra tap.
    await expect(page.getByTestId('location-map')).toBeVisible();
    expect(pins.at(-1)).toMatchObject({
      location: { name: 'Torre de Tóquio', address: 'Minato, Tóquio, Japão', latitude: 35.6586 },
    });
    await page.getByTestId('place-sheet-submit').click();
    await expect(page.getByTestId('place-sheet-submit')).toHaveCount(0);

    // Clicking the saved place views it, with the same map, before any editing.
    await page.getByText('Torre de Tóquio').first().click();
    await expect(page.getByTestId('place-detail')).toBeVisible();
    await expect(page.getByTestId('place-detail').getByTestId('location-map')).toBeVisible();
    await expect(page.getByTestId('place-detail-edit')).toBeVisible();
  });

  test('bookings: a hotel shows its map, a flight has none, and both open to a view first', async ({
    page,
    request,
  }) => {
    await page.route('**/api/v1/trips/*/maps/location', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PIN }),
    );
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    const headers = { Authorization: `Bearer ${ana.token}` };
    expect(
      (
        await request.post(`${API}/api/v1/trips/${trip.id}/hotels`, {
          headers,
          data: {
            name: 'Hotel Sakura',
            location: { name: 'Hotel Sakura', address: 'Asakusa, Tóquio' },
            checkIn: { dateTime: '2027-04-03T15:00:00', timezone: 'Asia/Tokyo' },
            checkOut: { dateTime: '2027-04-07T11:00:00', timezone: 'Asia/Tokyo' },
          },
        })
      ).status(),
    ).toBe(201);
    expect(
      (
        await request.post(`${API}/api/v1/trips/${trip.id}/flights`, {
          headers,
          data: {
            flightNumber: 'LA8084',
            departureAirport: 'GRU',
            arrivalAirport: 'NRT',
            departure: { dateTime: '2027-04-01T22:10:00', timezone: 'America/Sao_Paulo' },
            arrival: { dateTime: '2027-04-03T06:30:00', timezone: 'Asia/Tokyo' },
          },
        })
      ).status(),
    ).toBe(201);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/bookings`);
    await page.getByText('GRU → NRT · LA8084').click();
    await expect(page.getByTestId('flight-detail')).toContainText('20 h 20');
    await expect(page.getByTestId('open-google-maps')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.getByTestId('bookings-tabs-hotels').click();
    await page.getByText('Hotel Sakura').first().click();
    await expect(page.getByTestId('hotel-detail')).toContainText('4 noites');
    await expect(page.getByTestId('hotel-detail').getByTestId('location-map')).toBeVisible();
    await expect(page.getByTestId('hotel-detail-edit')).toBeVisible();
  });

  // A day with three places, timed so the second trip does not fit: the museum ends at 13:00 and
  // dinner is at 13:20, but the trip takes 45 minutes.
  async function seedDay(request: import('@playwright/test').APIRequestContext) {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const makeDay = async (date: string) =>
      (
        await (
          await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-days`, {
            headers,
            data: { date },
          })
        ).json()
      ).id as string;
    const first = await makeDay('2027-04-02');
    const second = await makeDay('2027-04-03');
    const at = (date: string, time: string) => ({
      dateTime: `${date}T${time}:00`,
      timezone: 'Asia/Tokyo',
    });
    for (const [dayId, date, title, start, end, place] of [
      [
        first,
        '2027-04-02',
        'Templo Senso-ji',
        '09:00',
        '10:30',
        { name: 'Senso-ji', latitude: 35.7148, longitude: 139.7967 },
      ],
      [
        first,
        '2027-04-02',
        'Museu Nacional',
        '11:00',
        '13:00',
        { name: 'Museu Nacional', latitude: 35.7189, longitude: 139.7765 },
      ],
      [
        first,
        '2027-04-02',
        'Jantar em Shibuya',
        '13:20',
        undefined,
        { name: 'Shibuya', address: 'Shibuya, Tóquio' },
      ],
      [first, '2027-04-02', 'Café sem local', '08:00', undefined, undefined],
      [
        second,
        '2027-04-03',
        'Parque Ueno',
        '10:00',
        '12:00',
        { name: 'Ueno Park', latitude: 35.7146, longitude: 139.7732 },
      ],
      [
        second,
        '2027-04-03',
        'Akihabara',
        '15:00',
        undefined,
        { name: 'Akihabara', latitude: 35.6984, longitude: 139.7731 },
      ],
    ] as const) {
      const made = await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-items`, {
        headers,
        data: {
          dayId,
          title,
          category: 'ATTRACTION',
          start: at(date, start),
          ...(end ? { end: at(date, end) } : {}),
          ...(place ? { location: place } : {}),
        },
      });
      expect(made.status(), await made.text()).toBe(201);
    }
    return { ana, trip };
  }

  const dayMapResponse = (image?: string) =>
    JSON.stringify({
      legs: [
        {
          from: 0,
          to: 1,
          available: true,
          durationSeconds: 1500,
          distanceMeters: 6200,
          polyline: '_p~iF~ps|U_ulLnnqC',
        },
        {
          from: 1,
          to: 2,
          available: true,
          durationSeconds: 2700,
          distanceMeters: 12400,
          polyline: '_ulLnnqC_mqNvxq`@',
        },
      ],
      ...(image ? { image } : {}),
    });

  // The stand-in for Google's script: it records what the page asks the map to do.
  const FAKE_GOOGLE_MAPS = `
    (() => {
      const log = (window.__maps = { markers: [], lines: 0, maps: 0, info: [], markerObjects: [] });
      class LatLngBounds { constructor() { this.n = 0; } extend() { this.n++; } isEmpty() { return this.n === 0; } }
      class Map { constructor(el) { log.maps++; el.setAttribute('data-fake-map', '1'); } fitBounds() {} panTo() {} }
      class Marker {
        constructor(o) { this.o = o; this.on = {}; log.markers.push(o.label.text + ':' + o.title); log.markerObjects.push(this); }
        setMap() {} setIcon(i) { this.icon = i; } setZIndex() {} addListener(e, fn) { this.on[e] = fn; }
      }
      class Polyline { constructor() { log.lines++; } setMap() {} }
      class InfoWindow { setContent(c) { this.c = c; } setPosition() {} open() { log.info.push(this.c.textContent); } close() {} }
      window.google = { maps: { importLibrary: async () => ({ Map }), Map, Marker, Polyline, InfoWindow, LatLngBounds, SymbolPath: { CIRCLE: 0 } } };
      window.__rinoMapsReady();
    })();`;

  test('itinerary: the day map shows each stop with when to be there, each trip and its warning', async ({
    page,
    request,
  }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json', body: dayMapResponse() });
    });
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    // Computers show the map beside the list; phones open it from the day.
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    const panel = page.getByTestId('day-map-panel');
    await expect(panel).toBeVisible();

    // Every stop, in time order, with when to be there.
    const stops = panel.getByTestId('day-map-stops');
    await expect(stops).toContainText('09:00');
    await expect(stops).toContainText('Templo Senso-ji');
    await expect(stops.getByTestId('day-stop-1')).toContainText('11:00');
    await expect(stops.getByTestId('day-stop-2')).toContainText('Jantar em Shibuya');

    // The trips between them: how long, how far, when to leave.
    const first = panel.getByTestId('day-leg-0');
    await expect(first).toContainText('25 min');
    await expect(first).toContainText('6,2 km');
    await expect(first).toContainText('Saia às 10:35');
    // The museum ends at 13:00 and dinner is at 13:20: 20 minutes for a 45-minute trip.
    await expect(panel.getByTestId('day-leg-1')).toContainText('Apertado');
    await expect(panel.getByTestId('day-leg-0')).not.toContainText('Apertado');
    await expect(panel).toContainText('3 paradas');
    await expect(panel).toContainText('1 h 10 em deslocamento');

    // The server was asked once, for the right stops, without a picture (the map is interactive).
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ mode: 'TRANSIT', includeImage: false });
    expect((requests[0] as { stops: { label: string }[] }).stops.map((stop) => stop.label)).toEqual(
      ['Templo Senso-ji', 'Museu Nacional', 'Jantar em Shibuya'],
    );

    // The real page-side map got numbered pins and one line per trip.
    await expect(page.locator('[data-fake-map="1"]')).toBeVisible();
    const drawn = await page.evaluate(
      () => (window as never as { __maps: { markers: string[]; lines: number } }).__maps,
    );
    expect(drawn.markers).toEqual(['1:Templo Senso-ji', '2:Museu Nacional', '3:Jantar em Shibuya']);
    expect(drawn.lines).toBe(2);

    // Clicking a pin selects its stop in the list and opens its details on the map.
    await page.evaluate(() => {
      const maps = (
        window as never as { __maps: { markerObjects: { on: { click: () => void } }[] } }
      ).__maps;
      maps.markerObjects[1]?.on.click();
    });
    await expect(panel.getByTestId('day-stop-1')).toHaveAttribute('aria-label', 'Museu Nacional');
    const info = await page.evaluate(
      () => (window as never as { __maps: { info: string[] } }).__maps.info,
    );
    expect(info.at(-1)).toContain('Museu Nacional');

    // Another way to get around is another question for the server.
    await page.getByTestId('day-mode-WALKING').click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1]).toMatchObject({ mode: 'WALKING' });

    // A stop opens its own details.
    await panel.getByTestId('day-stop-open-0').click();
    await expect(page.getByTestId('item-detail')).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Templo Senso-ji' }),
    ).toBeVisible();
  });

  test('itinerary: when Google refuses the browser key the day falls back to the server picture', async ({
    page,
    request,
  }) => {
    const PNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const requests: Record<string, unknown>[] = [];
    // Google's script loads, then reports that the key is not allowed on this site.
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: 'window.__rinoMapsReady(); setTimeout(() => window.gm_authFailure && window.gm_authFailure(), 50);',
      }),
    );
    await page.route('**/api/v1/trips/*/maps/day', async (route) => {
      const body = route.request().postDataJSON();
      requests.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: dayMapResponse(body.includeImage ? PNG : undefined),
      });
    });
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();

    await expect(page.getByTestId('day-map-image')).toBeVisible();
    expect(requests.at(-1)).toMatchObject({ includeImage: true });
    // The list and the times are the same with or without the interactive map.
    await expect(page.getByTestId('day-leg-0')).toContainText('Saia às 10:35');
  });

  // One leg per pair of stops asked for, whatever their number: the first 25 min, the rest 45.
  const answerDayMap =
    (requests: Record<string, unknown>[]) => async (route: import('@playwright/test').Route) => {
      const body = route.request().postDataJSON() as { stops: unknown[] };
      requests.push(body);
      const legs = body.stops.slice(1).map((_, index) => ({
        from: index,
        to: index + 1,
        available: true,
        durationSeconds: index === 0 ? 1500 : 2700,
        distanceMeters: 5000,
        polyline: '_p~iF~ps|U_ulLnnqC',
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ legs }),
      });
    };

  test('itinerary: any day of the trip can be put on the map, one after the other', async ({
    page,
    request,
  }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap(requests));
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    const panel = page.getByTestId('day-map-panel');
    await expect(panel.getByTestId('day-stop-0')).toContainText('Templo Senso-ji');

    // The strip holds every day of the trip, not only the ones with places.
    await expect(page.locator('[data-testid^="map-day-"]')).toHaveCount(15);

    await page.getByTestId('map-next-day').click();
    await expect(panel.getByTestId('day-stop-0')).toContainText('Parque Ueno');
    await expect(panel.getByTestId('day-stop-1')).toContainText('Akihabara');
    await expect(panel.getByTestId('day-stop-2')).toHaveCount(0);
    expect((requests.at(-1) as { stops: { label: string }[] }).stops.map((s) => s.label)).toEqual([
      'Parque Ueno',
      'Akihabara',
    ]);

    // A day with nothing to map says so instead of showing a blank map.
    await page.getByTestId('map-day-2027-04-05').click();
    await expect(page.getByTestId('day-map-empty')).toBeVisible();

    // Coming back to a day already seen does not ask the server again.
    const asked = requests.length;
    await page.getByTestId('map-day-2027-04-02').click();
    await expect(panel.getByTestId('day-stop-0')).toContainText('Templo Senso-ji');
    expect(requests.length).toBe(asked);
    // The arrows step through every day, including the ones with nothing on them.
    await page.getByTestId('map-prev-day').click();
    await expect(page.getByTestId('day-map-empty')).toBeVisible();
  });

  test('itinerary: the whole trip on one map, every place in order with a colour and number per day', async ({
    page,
    request,
  }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap(requests));
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    await page.getByTestId('map-scope-trip').click();

    const panel = page.getByTestId('day-map-panel');
    await expect(panel).toContainText('5 paradas');
    // Days appear as groups, in order, and the trip from one day's last place to the next day's first
    // is marked as the next morning.
    // Days are numbered as in the trip: the first day has no places, so these are days 2 and 3.
    await expect(panel.getByTestId('day-group-1')).toContainText('Dia 2');
    await expect(panel.getByTestId('day-group-2')).toContainText('Dia 3');
    await expect(panel.getByTestId('day-stop-2')).toContainText('Jantar em Shibuya');
    await expect(panel.getByTestId('day-stop-3')).toContainText('Parque Ueno');
    await expect(panel.getByTestId('day-leg-2')).toContainText('Na manhã seguinte');
    // The chip strip belongs to the day view only.
    await expect(page.getByTestId('map-next-day')).toHaveCount(0);

    // One request with every place, each tagged with its day's colour group and the day on its pin.
    const body = requests.at(-1) as { stops: { label: string; group: number; pin: string }[] };
    expect(body.stops.map((s) => [s.label, s.group, s.pin])).toEqual([
      ['Templo Senso-ji', 1, '2'],
      ['Museu Nacional', 1, '2'],
      ['Jantar em Shibuya', 1, '2'],
      ['Parque Ueno', 2, '3'],
      ['Akihabara', 2, '3'],
    ]);

    // On the map: pins carry their day number, and the four trips between the five places are lines.
    const drawn = await page.evaluate(
      () => (window as never as { __maps: { markers: string[]; lines: number } }).__maps,
    );
    // (The log keeps earlier drawings too: the day view was drawn before the trip.)
    expect(drawn.markers.slice(-5).map((m) => m.split(':')[0])).toEqual(['2', '2', '2', '3', '3']);
    expect(drawn.lines).toBeGreaterThanOrEqual(4);

    // Going back to one day works too.
    await page.getByTestId('map-scope-day').click();
    await expect(panel).toContainText('3 paradas');
  });

  test('itinerary: things with no place are listed apart, with a way to add one', async ({
    page,
    request,
  }) => {
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap([]));
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();

    const unlocated = page.getByTestId('day-map-unlocated');
    await expect(unlocated).toContainText('Café sem local');
    await expect(unlocated).toContainText('08:00');
    // It is not a stop, so it is not numbered on the map.
    await expect(page.getByTestId('day-map-stops')).not.toContainText('Café sem local');

    await unlocated.getByRole('button', { name: 'Adicionar local' }).click();
    await expect(page.getByTestId('item-title')).toHaveValue('Café sem local');
    await expect(page.getByTestId('item-place-search')).toBeVisible();
  });

  test('itinerary: on a computer each column scrolls on its own and the map stays in view', async ({
    page,
    request,
  }) => {
    test.skip(isPhone(page), 'The two columns exist only on computers');
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap([]));
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    await page.getByTestId('map-scope-trip').click();
    await expect(page.getByTestId('day-map-panel')).toContainText('5 paradas');
    await expect(page.locator('[data-fake-map="1"]')).toBeVisible();

    const list = page.getByTestId('itinerary-list');
    const column = page.getByTestId('itinerary-map-column');
    const state = (locator: import('@playwright/test').Locator) =>
      locator.evaluate((el) => ({
        top: el.scrollTop,
        scrollable: el.scrollHeight > el.clientHeight,
      }));

    // Both columns have more than fits, so each needs its own scroll; the page itself does not scroll.
    expect((await state(list)).scrollable).toBe(true);
    expect((await state(column)).scrollable).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Scrolling the map column leaves the day list where it was, and the map stays in view.
    // (React Native Web replaces the element's own scrollTo with its own, so set scrollTop.)
    await column.evaluate((el) => {
      el.scrollTop = 500;
    });
    expect((await state(column)).top).toBeGreaterThan(0);
    expect((await state(list)).top).toBe(0);
    const map = await page.locator('[data-fake-map="1"]').boundingBox();
    expect(map?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect(map?.y ?? 9999).toBeLessThan(page.viewportSize()?.height ?? 0);

    // And the other way round: the day list scrolls to its end without moving the map column.
    const before = (await state(column)).top;
    await list.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect((await state(list)).top).toBeGreaterThan(0);
    expect((await state(column)).top).toBe(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  // Opening a Google Maps link starts a navigation to google.com; record it instead of going there.
  async function recordMapsLinks(context: import('@playwright/test').BrowserContext) {
    const opened: URL[] = [];
    await context.route('https://www.google.com/**', async (route) => {
      opened.push(new URL(route.request().url()));
      await route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' });
    });
    return opened;
  }

  test('itinerary: the map, its button and each trip open in Google Maps', async ({
    page,
    request,
    context,
  }) => {
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap([]));
    const opened = await recordMapsLinks(context);
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    const latest = async (count: number) => {
      await expect.poll(() => opened.length).toBe(count);
      return opened[count - 1] as URL;
    };

    // The whole day as one route: first place to last, the middle one as a stop between.
    await page.getByTestId('day-map-open').click();
    const all = await latest(1);
    expect(all.pathname).toBe('/maps/dir/');
    expect(all.searchParams.get('origin')).toBe('35.7148,139.7967');
    expect(all.searchParams.get('waypoints')).toBe('35.7189,139.7765');
    expect(all.searchParams.get('destination')).toBe('Shibuya, Tóquio');
    // Public transit cannot have stops in between, so the link leaves the mode out and the panel says why.
    expect(all.searchParams.has('travelmode')).toBe(false);
    await expect(page.getByTestId('day-map-transit-note')).toBeVisible();

    // Walking has no such limit: the mode goes into the link and the note goes away.
    await page.getByTestId('day-mode-WALKING').click();
    await expect(page.getByTestId('day-map-transit-note')).toHaveCount(0);
    await page.getByTestId('day-map-open').click();
    expect((await latest(2)).searchParams.get('travelmode')).toBe('walking');

    // One hop opens with the real public transit of that stretch, whatever the rest of the day.
    await page.getByTestId('day-mode-TRANSIT').click();
    await page.getByTestId('day-leg-0').click();
    const hop = await latest(3);
    expect(hop.searchParams.get('origin')).toBe('35.7148,139.7967');
    expect(hop.searchParams.get('destination')).toBe('35.7189,139.7765');
    expect(hop.searchParams.get('travelmode')).toBe('transit');
    expect(hop.searchParams.has('waypoints')).toBe(false);
  });

  test('itinerary: clicking the picture of the day opens it in Google Maps', async ({
    page,
    request,
    context,
  }) => {
    const PNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: 'window.__rinoMapsReady(); setTimeout(() => window.gm_authFailure && window.gm_authFailure(), 50);',
      }),
    );
    await page.route('**/api/v1/trips/*/maps/day', async (route) => {
      const body = route.request().postDataJSON() as { stops: unknown[]; includeImage: boolean };
      const legs = body.stops.slice(1).map((_, index) => ({
        from: index,
        to: index + 1,
        available: true,
        durationSeconds: 1500,
        distanceMeters: 5000,
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ legs, ...(body.includeImage ? { image: PNG } : {}) }),
      });
    });
    const opened = await recordMapsLinks(context);
    const { ana, trip } = await seedDay(request);

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    await page.getByTestId('day-map-image').click();

    await expect.poll(() => opened.length).toBe(1);
    expect(opened[0]?.pathname).toBe('/maps/dir/');
    expect(opened[0]?.searchParams.get('waypoints')).toBe('35.7189,139.7765');
  });

  test('itinerary: a route too long for one link is opened in parts on a phone', async ({
    page,
    request,
    context,
  }) => {
    await page.route('https://maps.googleapis.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GOOGLE_MAPS }),
    );
    await page.route('**/api/v1/trips/*/maps/day', answerDayMap([]));
    const opened = await recordMapsLinks(context);

    // Seven places in one day: more than a phone's link can take, fewer than a computer's.
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    const headers = { Authorization: `Bearer ${ana.token}` };
    const day = await (
      await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-days`, {
        headers,
        data: { date: '2027-04-02' },
      })
    ).json();
    for (let i = 0; i < 7; i++) {
      const made = await request.post(`${API}/api/v1/trips/${trip.id}/itinerary-items`, {
        headers,
        data: {
          dayId: day.id,
          title: `Lugar ${i + 1}`,
          category: 'ATTRACTION',
          start: {
            dateTime: `2027-04-02T${String(8 + i).padStart(2, '0')}:00:00`,
            timezone: 'Asia/Tokyo',
          },
          location: { name: `Lugar ${i + 1}`, latitude: 35 + i / 100, longitude: 139 },
        },
      });
      expect(made.status()).toBe(201);
    }

    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/itinerary`);
    if (isPhone(page)) await page.getByTestId('day-map-2027-04-02').click();
    await expect(page.getByTestId('day-map-panel')).toContainText('7 paradas');
    await page.getByTestId('day-map-open').click();

    if (isPhone(page)) {
      // Phone links take three stops in between: the day is offered as two parts sharing a stop.
      await expect(page.getByTestId('day-map-chooser')).toContainText('Parte 1');
      await expect(page.getByTestId('day-map-chooser')).toContainText('Paradas 5 a 7');
      await page.getByTestId('day-map-open-part-1').click();
      await expect.poll(() => opened.length).toBe(1);
      expect(opened[0]?.searchParams.get('origin')).toBe('35.04,139');
      expect(opened[0]?.searchParams.get('destination')).toBe('35.06,139');
      expect(opened[0]?.searchParams.get('waypoints')).toBe('35.05,139');
    } else {
      // A computer's link takes nine: all seven places fit in one.
      await expect.poll(() => opened.length).toBe(1);
      expect(opened[0]?.searchParams.get('origin')).toBe('35,139');
      expect(opened[0]?.searchParams.get('destination')).toBe('35.06,139');
      expect(opened[0]?.searchParams.get('waypoints')?.split('|')).toHaveLength(5);
    }
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

    // The row opens a view with the file's details; editing and opening the file are one tap away.
    await page.getByText('passagem', { exact: true }).click();
    await expect(page.getByTestId('document-detail')).toContainText('passagem.pdf');
    await expect(page.getByTestId('open-document-file')).toBeVisible();
    await expect(page.getByTestId('document-detail-edit')).toBeVisible();
    await page.keyboard.press('Escape');

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

  test('checklist: an item is added, ticked off, edited and removed', async ({ page, request }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await page.goto(`/trips/${trip.id}/checklist`);

    // A plain item: no category or quantity typed in defaults to "Outros" and one.
    await page.getByTestId('add-checklist-item').click();
    await page.getByTestId('checklist-title').fill('Passaporte');
    await page.getByTestId('checklist-sheet-submit').click();
    await expect(page.getByTestId('checklist-category-OTHER')).toContainText('Passaporte');
    await expect(page.getByTestId('checklist-summary')).toContainText('0 de 1');

    // A second item with its category and quantity chosen.
    await page.getByTestId('add-checklist-item').click();
    await page.getByTestId('checklist-title').fill('Meias');
    await page.getByTestId('checklist-category').click();
    await page.getByTestId('checklist-category-option-CLOTHES').click();
    await page.getByTestId('checklist-quantity').fill('5');
    await page.getByTestId('checklist-sheet-submit').click();
    await expect(page.getByTestId('checklist-category-CLOTHES')).toContainText('Meias');
    await expect(page.getByTestId('checklist-category-CLOTHES')).toContainText('×5');
    await expect(page.getByTestId('checklist-summary')).toContainText('0 de 2');

    // Ticking an item off updates the progress without opening it.
    const passportRow = page.getByTestId('checklist-category-OTHER');
    await passportRow.getByRole('button', { name: 'Marcar como na mala' }).click();
    await expect(page.getByTestId('checklist-summary')).toContainText('1 de 2');

    // Opening it shows the view first; editing goes through the pencil.
    await page.getByText('Passaporte', { exact: true }).click();
    await expect(page.getByTestId('checklist-detail')).toContainText('Na mala');
    await page.getByTestId('checklist-detail-edit').click();
    await page.getByTestId('checklist-title').fill('Passaporte e visto');
    await page.getByTestId('checklist-sheet-submit').click();
    await expect(page.getByTestId('checklist-category-OTHER')).toContainText('Passaporte e visto');

    // Removing an item takes it off the list and the progress total.
    await page.getByText('Meias', { exact: true }).click();
    await page.getByTestId('checklist-detail-edit').click();
    await page.getByTestId('checklist-sheet-delete').click();
    await confirmDelete(page);
    await expect(page.getByTestId('checklist-category-CLOTHES')).toHaveCount(0);
    await expect(page.getByTestId('checklist-summary')).toContainText('1 de 1');
    expect(errors).toEqual([]);
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
      ['expenses', 'Gastos'],
      ['checklist', 'Checklist'],
      ['documents', 'Documentos'],
      ['members', 'Membros'],
    ];
    const overflow = new Set(['expenses', 'checklist', 'documents', 'members']);
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
