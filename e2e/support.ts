import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API = process.env.E2E_API_URL ?? 'http://localhost:18080';
export const REGISTRATION_CODE = process.env.E2E_REGISTRATION_CODE ?? 'dev-registration-code';
export const PASSWORD = 'correct horse battery';

export interface Account {
  name: string;
  email: string;
  id: string;
  token: string;
}

let counter = 0;

export function uniqueEmail(name: string): string {
  counter += 1;
  return `${name.toLowerCase()}-${Date.now()}-${counter}@example.com`;
}

export async function registerViaApi(request: APIRequestContext, name: string): Promise<Account> {
  const email = uniqueEmail(name);
  const response = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, name, password: PASSWORD, registrationCode: REGISTRATION_CODE },
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = await response.json();
  return { name, email, id: body.user.id, token: body.token };
}

export async function createTripViaApi(
  request: APIRequestContext,
  owner: Account,
  overrides: Record<string, string> = {},
) {
  const response = await request.post(`${API}/api/v1/trips`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: {
      name: 'Japão 2027',
      destination: 'Tóquio',
      startDate: '2027-04-01',
      endDate: '2027-04-15',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      ...overrides,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as { id: string; version: number; name: string };
}

export async function addMemberViaApi(
  request: APIRequestContext,
  owner: Account,
  tripId: string,
  member: Account,
  role: 'ADMIN' | 'MEMBER' | 'VIEWER',
) {
  const response = await request.post(`${API}/api/v1/trips/${tripId}/members`, {
    headers: { Authorization: `Bearer ${owner.token}` },
    data: { email: member.email, role },
  });
  expect(response.status(), await response.text()).toBe(201);
}

export async function signInViaUi(page: Page, account: Account, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

/** Signs in and waits for the dashboard, so the next navigation cannot cut the login short. */
export async function signInToDashboard(page: Page, account: Account) {
  await signInViaUi(page, account);
  await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();
}

/** Signs in and opens the trips list; the landing page is now the dashboard. */
export async function signInToTrips(page: Page, account: Account) {
  await signInViaUi(page, account);
  await page.getByTestId('nav-trips').click();
  await expect(page.getByRole('heading', { name: 'Viagens' })).toBeVisible();
}

/** Collects browser errors (CORS, CSP, uncaught exceptions) so a test can assert there were none. */
export function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/** Opens the new-trip form from the sidebar (computers) or the raised tab-bar action (phones). */
export async function openNewTrip(page: Page) {
  await page.getByTestId('nav-new').click();
}

/** Today in the timezone the browser runs in (see playwright.config.ts). */
export function todayInSaoPaulo(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}

export async function createItemViaApi(
  request: APIRequestContext,
  owner: Account,
  tripId: string,
  item: { date: string; title: string; time?: string; timezone: string },
) {
  const headers = { Authorization: `Bearer ${owner.token}` };
  const day = await request.post(`${API}/api/v1/trips/${tripId}/itinerary-days`, {
    headers,
    data: { date: item.date },
  });
  expect(day.status(), await day.text()).toBe(201);
  const dayId = (await day.json()).id as string;
  const created = await request.post(`${API}/api/v1/trips/${tripId}/itinerary-items`, {
    headers,
    data: {
      dayId,
      title: item.title,
      category: 'ATTRACTION',
      start: item.time
        ? { dateTime: `${item.date}T${item.time}:00`, timezone: item.timezone }
        : null,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;
