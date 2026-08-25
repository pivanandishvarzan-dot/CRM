import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email: string, password = 'demo1234') {
  await page.goto('/login');
  await page.getByLabel('ایمیل').fill(email);
  await page.getByLabel('رمز عبور').fill(password);
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('anonymous users are redirected to login', async ({ page }) => {
  await page.goto('/properties');
  await expect(page).toHaveURL(/\/login/);
});

test('manager can access reports', async ({ page }) => {
  await login(page, 'manager@demo.local');
  await page.goto('/reports');
  await expect(page).toHaveURL(/\/reports/);
});

test('agent is blocked from manager-only reports', async ({ page }) => {
  await login(page, 'agent@demo.local');
  await page.goto('/reports');
  await expect(page).toHaveURL(/\/$/);
});

test('agent API only returns its own property records', async ({ page }) => {
  await login(page, 'agent@demo.local');
  const response = await page.request.get('/api/properties');
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.data;
  expect(rows.some((item: { code?: string }) => item.code === 'MLK-SEED-001')).toBeTruthy();
  expect(rows.some((item: { code?: string }) => item.code === 'MLK-PRIVATE-002')).toBeFalsy();
});

test('second agent cannot see first agent applicant records', async ({ page }) => {
  await login(page, 'agent2@demo.local');
  const response = await page.request.get('/api/applicants');
  expect(response.ok()).toBeTruthy();
  const rows = await response.json();
  expect(rows.some((item: { id?: string }) => item.id === 'seed-applicant-2')).toBeTruthy();
  expect(rows.some((item: { id?: string }) => item.id === 'seed-applicant')).toBeFalsy();
});

test('agent cannot patch another agents pipeline record', async ({ page }) => {
  await login(page, 'agent@demo.local');
  const response = await page.request.patch('/api/applicants/seed-applicant-2', { data: { status: 'WON' } });
  expect([403, 404]).toContain(response.status());
});
