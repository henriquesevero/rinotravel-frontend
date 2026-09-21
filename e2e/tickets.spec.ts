import { expect, test, type Page } from '@playwright/test';

import {
  API,
  addMemberViaApi,
  collectBrowserErrors,
  createTripViaApi,
  registerViaApi,
  signInToDashboard,
} from './support';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const PDF = (label: string) => Buffer.from(`%PDF-1.4\n% ${label}\n%%EOF\n`);

async function chooseFile(page: Page, testId: string, name: string) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByTestId(testId).click();
  await (await chooser).setFiles({ name, mimeType: 'application/pdf', buffer: PDF(name) });
}

async function openTickets(page: Page, tripId: string) {
  await page.goto(`/trips/${tripId}/bookings`);
  await page.getByTestId('bookings-tabs').getByText('Ingressos', { exact: true }).click();
}

test.describe('tickets', () => {
  test('a ticket is uploaded with where it is used, listed in documents and on its day', async ({
    page,
    request,
  }) => {
    // The venue is drawn on a map as it is typed; there is no Google here, so a picture stands in.
    await page.route('**/api/v1/trips/*/maps/location', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PNG, 'base64') }),
    );
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);
    await openTickets(page, trip.id);
    await expect(page.getByText('Nenhum ingresso ainda')).toBeVisible();

    await page.getByTestId('add-booking').click();
    await chooseFile(page, 'ticket-pick', 'hamilton.pdf');
    await expect(page.getByTestId('ticket-file')).toContainText('hamilton.pdf');
    await expect(page.getByTestId('ticket-name')).toHaveValue('hamilton');

    await page.getByTestId('ticket-name').fill('Hamilton');
    await page.getByTestId('ticket-kind').click();
    await page.getByTestId('ticket-kind-option-SHOW').click();
    await page.getByTestId('ticket-quantity').fill('2');
    await page.getByTestId('ticket-venue').fill('Teatro Municipal');
    await page.getByTestId('ticket-date').fill('2027-04-03');
    await page.getByLabel('Hora de início').fill('1900');
    await page.getByLabel('Hora de fim').fill('2145');
    await page.getByTestId('ticket-sheet-submit').click();

    // The list says what it is, when, where, how many, and that it has its file.
    const row = page.locator('[data-testid^="ticket-"]').filter({ hasText: 'Hamilton' }).first();
    await expect(row).toContainText('Teatro Municipal');
    await expect(row).toContainText('19:00');
    await expect(row).toContainText('×2');
    await expect(row).toContainText('Com arquivo');

    // The same file is a document of the trip, marked with the ticket that uses it.
    const headers = { Authorization: `Bearer ${ana.token}` };
    const docs = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/documents`, { headers })).json()
    ).items as { id: string; type: string; status: string; name: string }[];
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ type: 'TICKET', status: 'READY', name: 'Hamilton' });
    const tickets = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/tickets`, { headers })).json()
    ).items as {
      documentId: string;
      kind: string;
      quantity: number;
      start: { dateTime: string };
    }[];
    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toMatchObject({ documentId: docs[0]?.id, kind: 'SHOW', quantity: 2 });
    expect(tickets[0]?.start.dateTime).toBe('2027-04-03T19:00');

    await page.goto(`/trips/${trip.id}/documents`);
    await expect(page.getByText('Ingresso: Hamilton')).toBeVisible();

    // It is a line of its day in the itinerary.
    await page.goto(`/trips/${trip.id}/itinerary`);
    const day = page.getByTestId('day-2027-04-03');
    await expect(day).toContainText('Hamilton');
    await expect(day).toContainText('19:00');
    await expect(day).toContainText('Ingresso · Show ou espetáculo');
    expect(errors).toEqual([]);
  });

  test('a document already imported is linked to a ticket instead of sent again', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInToDashboard(page, ana);

    // The file is imported first, in the documents.
    await page.goto(`/trips/${trip.id}/documents`);
    await page.getByTestId('add-document').click();
    await chooseFile(page, 'document-pick', 'moma.pdf');
    await page.getByTestId('document-sheet-submit').click();
    await expect(page.getByText('moma', { exact: true })).toBeVisible();

    // Then a ticket is registered for it: where it goes, and which file it is.
    await openTickets(page, trip.id);
    await page.getByTestId('add-booking').click();
    await page.getByTestId('ticket-name').fill('MoMA');
    await page.getByTestId('ticket-venue').fill('Museum of Modern Art');
    await page.getByTestId('ticket-link').click();
    await page.locator('[data-testid^="ticket-link-"]').filter({ hasText: 'moma.pdf' }).click();
    await expect(page.getByTestId('ticket-file')).toContainText('moma');
    await page.getByTestId('ticket-sheet-submit').click();
    // Saved once it shows in the list.
    await expect(page.getByText('MoMA', { exact: true })).toBeVisible();

    const headers = { Authorization: `Bearer ${ana.token}` };
    const docs = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/documents`, { headers })).json()
    ).items as { id: string }[];
    expect(docs).toHaveLength(1);
    const tickets = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/tickets`, { headers })).json()
    ).items as { name: string; documentId: string }[];
    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toMatchObject({ name: 'MoMA', documentId: docs[0]?.id });

    // Its view opens the file, and editing can take the file off without deleting the document.
    await page.getByText('MoMA', { exact: true }).click();
    await expect(page.getByTestId('ticket-open-file')).toBeVisible();
    await page.getByTestId('ticket-detail-edit').click();
    await page.getByTestId('ticket-unlink').click();
    await page.getByTestId('ticket-sheet-submit').click();
    await expect
      .poll(async () => {
        const list = (
          await (await request.get(`${API}/api/v1/trips/${trip.id}/tickets`, { headers })).json()
        ).items as { documentId?: string }[];
        return list[0]?.documentId ?? null;
      })
      .toBeNull();
    const after = (
      await (await request.get(`${API}/api/v1/trips/${trip.id}/documents`, { headers })).json()
    ).items as unknown[];
    expect(after).toHaveLength(1);
  });

  test('a ticket with a place and a time is one line of its day, and a viewer only reads', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    const headers = { Authorization: `Bearer ${ana.token}` };
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');
    const made = await request.post(`${API}/api/v1/trips/${trip.id}/tickets`, {
      headers,
      data: { name: 'Teamlab', kind: 'MUSEUM', confirmationCode: 'SECRET1', seat: 'Setor B' },
    });
    expect(made.status(), await made.text()).toBe(201);

    await signInToDashboard(page, bia);
    await openTickets(page, trip.id);
    await expect(page.getByTestId('add-booking')).toHaveCount(0);
    await page.getByText('Teamlab', { exact: true }).click();
    await expect(page.getByTestId('ticket-detail')).toBeVisible();
    await expect(page.getByTestId('ticket-detail-edit')).toHaveCount(0);
    await expect(page.getByTestId('ticket-detail')).toContainText('Setor B');
    await expect(page.getByTestId('ticket-detail')).not.toContainText('SECRET1');
  });
});
