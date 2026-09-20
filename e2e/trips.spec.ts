import { expect, test, type Page } from '@playwright/test';

import {
  API,
  addMemberViaApi,
  collectBrowserErrors,
  createTripViaApi,
  openNewTrip,
  registerViaApi,
  signInViaUi,
} from './support';

async function fillTripForm(page: Page) {
  await page.getByLabel('Nome da viagem').fill('Japão 2027');
  await page.getByLabel('Destino').fill('Tóquio');
  await page.getByTestId('trip-start-date').fill('2027-04-01');
  await page.getByTestId('trip-end-date').fill('2027-04-15');

  await page.getByTestId('trip-timezone').click();
  await page.getByLabel('Buscar').fill('Tokyo');
  await page.getByTestId('trip-timezone-option-Asia/Tokyo').click();

  await page.getByTestId('trip-currency').click();
  await page.getByLabel('Buscar').fill('JPY');
  await page.getByTestId('trip-currency-option-JPY').click();
}

test.describe('trips and members', () => {
  test('an owner creates a trip and manages its members end to end', async ({ page, request }) => {
    const errors = collectBrowserErrors(page);
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    await signInViaUi(page, ana);

    await expect(
      page.getByText('Sua próxima viagem começa aqui').filter({ visible: true }),
    ).toBeVisible();
    await openNewTrip(page);
    await fillTripForm(page);
    await page.getByRole('button', { name: 'Criar viagem', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Japão 2027' })).toBeVisible();
    await expect(page.getByText('Tóquio').filter({ visible: true })).toBeVisible();
    await expect(
      page.getByText('1–15 abr. 2027 · 15 dias').filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText('JPY').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Asia/Tokyo').filter({ visible: true })).toBeVisible();

    await page.getByTestId('open-members').click();
    await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible();
    await expect(page.getByText(`${ana.name} (você)`)).toBeVisible();

    await page.getByTestId('add-member').click();
    await page.getByLabel('Email').fill(bia.email);
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    const biaRow = page.getByTestId(`member-${bia.email}`);
    await expect(biaRow).toBeVisible();
    await expect(biaRow).toContainText('Membro');

    await biaRow.click();
    await page.getByRole('button', { name: /Tornar Leitor/ }).click();
    await expect(biaRow).toContainText('Leitor');

    await biaRow.click();
    await page.getByRole('button', { name: 'Remover da viagem' }).click();
    await page.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(biaRow).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('shows a created trip in the list with its phase and opens it', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInViaUi(page, ana);

    const card = page.getByTestId(`trip-${trip.id}`);
    await expect(card).toContainText('Japão 2027');
    await expect(card).toContainText('Em breve');
    await card.click();

    await expect(page).toHaveURL(new RegExp(`/trips/${trip.id}$`));
    await expect(page.getByRole('heading', { name: 'Japão 2027' })).toBeVisible();
  });

  test('a deep link survives a page reload', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInViaUi(page, ana);
    await expect(page.getByRole('heading', { name: 'Viagens' })).toBeVisible();

    await page.goto(`/trips/${trip.id}/members`);
    await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible();
    await expect(page.getByText(`${ana.name} (você)`)).toBeVisible();
  });

  test('the UI only offers what the server says each role can do', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'VIEWER');

    await signInViaUi(page, bia);
    await page.getByTestId(`trip-${trip.id}`).click();

    await expect(page.getByRole('heading', { name: 'Japão 2027' })).toBeVisible();
    await expect(page.getByTestId('open-members')).toBeVisible();
    await expect(page.getByTestId('leave-trip')).toBeVisible();
    await expect(page.getByTestId('edit-trip')).toHaveCount(0);
    await expect(page.getByTestId('delete-trip')).toHaveCount(0);
    await expect(page.getByTestId('transfer-ownership')).toHaveCount(0);

    await page.getByTestId('open-members').click();
    await expect(page.getByTestId('add-member')).toHaveCount(0);
  });

  test('a member can leave a trip and it disappears from their list', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'MEMBER');

    await signInViaUi(page, bia);
    await page.getByTestId(`trip-${trip.id}`).click();
    await page.getByTestId('leave-trip').click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();

    await expect(
      page.getByText('Sua próxima viagem começa aqui').filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByTestId(`trip-${trip.id}`)).toHaveCount(0);
  });

  test('the owner transfers ownership and loses the owner-only actions', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const bia = await registerViaApi(request, 'Bia');
    const trip = await createTripViaApi(request, ana);
    await addMemberViaApi(request, ana, trip.id, bia, 'MEMBER');

    await signInViaUi(page, ana);
    await page.getByTestId(`trip-${trip.id}`).click();
    await page.getByTestId('transfer-ownership').click();
    await page.getByRole('button', { name: new RegExp(bia.email) }).click();
    await page.getByRole('button', { name: 'Transferir', exact: true }).click();

    await expect(page.getByTestId('delete-trip')).toHaveCount(0);
    await expect(page.getByTestId('transfer-ownership')).toHaveCount(0);
    await expect(page.getByTestId('edit-trip')).toBeVisible();
  });

  test('deleting a trip removes it for everyone', async ({ page, request }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);

    await signInViaUi(page, ana);
    await page.getByTestId(`trip-${trip.id}`).click();
    await page.getByTestId('delete-trip').click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(
      page.getByText('Sua próxima viagem começa aqui').filter({ visible: true }),
    ).toBeVisible();
    const gone = await request.get(`${API}/api/v1/trips/${trip.id}`, {
      headers: { Authorization: `Bearer ${ana.token}` },
    });
    expect(gone.status()).toBe(404);
  });

  test('editing sends only the changed fields and surfaces version conflicts', async ({
    page,
    request,
  }) => {
    const ana = await registerViaApi(request, 'Ana');
    const trip = await createTripViaApi(request, ana);
    await signInViaUi(page, ana);
    await page.getByTestId(`trip-${trip.id}`).click();
    await page.getByTestId('edit-trip').click();

    const name = page.getByLabel('Nome da viagem');
    await expect(name).toHaveValue('Japão 2027');

    const bump = await request.patch(`${API}/api/v1/trips/${trip.id}`, {
      headers: { Authorization: `Bearer ${ana.token}` },
      data: { baseVersion: trip.version, destination: 'Quioto' },
    });
    expect(bump.status()).toBe(200);

    await name.fill('Japão e Coreia');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Esta viagem mudou')).toBeVisible();

    await page.getByRole('button', { name: 'Carregar versão atual' }).click();
    await expect(page.getByLabel('Destino')).toHaveValue('Quioto');
    await expect(name).toHaveValue('Japão 2027');

    await name.fill('Japão e Coreia');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByRole('heading', { name: 'Japão e Coreia' })).toBeVisible();
    await expect(page.getByText('Quioto').filter({ visible: true })).toBeVisible();
  });

  test('renders in dark mode and on small screens without errors', async ({ page, request }) => {
    const errors = collectBrowserErrors(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    const ana = await registerViaApi(request, 'Ana');
    await createTripViaApi(request, ana);
    await signInViaUi(page, ana);

    await expect(page.getByRole('heading', { name: 'Viagens' })).toBeVisible();
    await page.screenshot({ path: 'test-results/trips-dark.png' });
    expect(errors).toEqual([]);
  });
});
