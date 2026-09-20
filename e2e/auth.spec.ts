import { expect, test } from '@playwright/test';

import {
  API,
  PASSWORD,
  REGISTRATION_CODE,
  collectBrowserErrors,
  registerViaApi,
  signInViaUi,
  uniqueEmail,
} from './support';

test.describe('authentication', () => {
  test('sends signed out visitors to the login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  });

  test('validates the form before calling the API', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

    await expect(page.getByText('Campo obrigatório').first()).toBeVisible();
    await expect(page.getByText('Use pelo menos 10 caracteres')).toBeVisible();
  });

  test('rejects a wrong invitation code', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Nome', { exact: true }).fill('Ana');
    await page.getByLabel('Email').fill(uniqueEmail('ana'));
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Código de convite').fill('not-the-code');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

    await expect(page.getByText('Código de convite inválido.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('registers, lands on the dashboard and survives a reload', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/register');
    await page.getByLabel('Nome', { exact: true }).fill('Ana Silva');
    await page.getByLabel('Email').fill(uniqueEmail('ana'));
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Código de convite').fill(REGISTRATION_CODE);
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

    await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();
    await expect(page.getByText('Sua próxima viagem começa aqui')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('shows a friendly error for wrong credentials and then signs in and out', async ({
    page,
    request,
  }) => {
    const account = await registerViaApi(request, 'Bia');

    await signInViaUi(page, account, 'wrong password!');
    await expect(page.getByText('Email ou senha incorretos.')).toBeVisible();

    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();

    await page.getByTestId('open-account').click();
    await expect(page.getByRole('dialog').getByText(account.email)).toBeVisible();
    await page.getByTestId('logout').click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a revoked session sends the user back to login', async ({ page, request }) => {
    const account = await registerViaApi(request, 'Caio');
    await signInViaUi(page, account);
    await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();

    const revoke = await request.post(`${API}/api/v1/auth/logout`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('rinotravel.session-token'))}`,
      },
    });
    expect(revoke.status()).toBe(204);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  });
});
