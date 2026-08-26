import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { createHash } from 'crypto';

test.describe.configure({ mode: 'serial' });

const prisma = new PrismaClient();
const PASSWORD = process.env.SEED_PASSWORD || 'demo1234';

function hashRecoveryCode(code: string) {
  return createHash('sha256').update(code.replace(/\s/g, '').toUpperCase()).digest('hex');
}

async function resetSecurity(email: string) {
  await prisma.user.update({ where: { email }, data: { failedLoginAttempts: 0, lockedUntil: null, twoFactorEnabled: false, twoFactorSecret: null, recoveryCodes: [] } });
}

async function login(page: Page, email: string, password = PASSWORD, twoFactorCode = '') {
  await page.goto('/login');
  await page.getByLabel('ایمیل').fill(email);
  await page.getByLabel('رمز عبور').fill(password);
  if (twoFactorCode) await page.getByLabel('کد دومرحله‌ای یا Recovery Code').fill(twoFactorCode);
  await page.getByRole('button', { name: 'ورود امن' }).click();
}

test.afterAll(async () => { await Promise.all(['manager@demo.local','agent@demo.local','agent2@demo.local'].map(resetSecurity)); await prisma.$disconnect(); });

test('anonymous users are redirected to login', async ({ page }) => {
  await page.goto('/properties');
  await expect(page).toHaveURL(/\/login/);
});

test('manager can access reports', async ({ page }) => {
  await resetSecurity('manager@demo.local');
  await login(page, 'manager@demo.local');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/reports');
  await expect(page).toHaveURL(/\/reports/);
});

test('agent is blocked from manager-only reports', async ({ page }) => {
  await resetSecurity('agent@demo.local');
  await login(page, 'agent@demo.local');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/reports');
  await expect(page).toHaveURL(/\/$/);
});

test('account locks after five invalid passwords', async ({ page }) => {
  const email = 'agent2@demo.local';
  await resetSecurity(email);
  for (let i = 0; i < 5; i++) {
    await login(page, email, 'wrongpass123');
    await expect(page.getByRole('alert')).toBeVisible();
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, select: { lockedUntil: true } });
  expect(user.lockedUntil?.getTime() || 0).toBeGreaterThan(Date.now());
  await login(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/login/);
  await resetSecurity(email);
});

test('TOTP is required and valid TOTP allows login', async ({ page }) => {
  const email = 'agent@demo.local';
  await resetSecurity(email);
  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { email }, data: { twoFactorEnabled: true, twoFactorSecret: secret } });
  await login(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/login/);
  const code = authenticator.generate(secret);
  await login(page, email, PASSWORD, code);
  await expect(page).toHaveURL(/\/$/);
  await resetSecurity(email);
});

test('recovery code is single use', async ({ page }) => {
  const email = 'agent2@demo.local';
  await resetSecurity(email);
  const secret = authenticator.generateSecret();
  const recovery = 'ABC123-DEF456';
  await prisma.user.update({ where: { email }, data: { twoFactorEnabled: true, twoFactorSecret: secret, recoveryCodes: [hashRecoveryCode(recovery)] } });
  await login(page, email, PASSWORD, recovery);
  await expect(page).toHaveURL(/\/$/);
  const after = await prisma.user.findUniqueOrThrow({ where: { email }, select: { recoveryCodes: true } });
  expect(after.recoveryCodes).not.toContain(hashRecoveryCode(recovery));
  await page.context().clearCookies();
  await login(page, email, PASSWORD, recovery);
  await expect(page).toHaveURL(/\/login/);
  await resetSecurity(email);
});

test('revoking sessions invalidates an existing JWT', async ({ page }) => {
  const email = 'agent@demo.local';
  await resetSecurity(email);
  await login(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
  await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  const response = await page.request.get('/api/properties');
  expect(response.status()).toBe(401);
});

test('agent API only returns its own property records', async ({ page }) => {
  await resetSecurity('agent@demo.local');
  await login(page, 'agent@demo.local');
  await expect(page).toHaveURL(/\/$/);
  const response = await page.request.get('/api/properties');
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.data;
  expect(rows.some((item: { code?: string }) => item.code === 'MLK-SEED-001')).toBeTruthy();
  expect(rows.some((item: { code?: string }) => item.code === 'MLK-PRIVATE-002')).toBeFalsy();
});

test('second agent cannot see first agent applicant records', async ({ page }) => {
  await resetSecurity('agent2@demo.local');
  await login(page, 'agent2@demo.local');
  await expect(page).toHaveURL(/\/$/);
  const response = await page.request.get('/api/applicants');
  expect(response.ok()).toBeTruthy();
  const rows = await response.json();
  expect(rows.some((item: { id?: string }) => item.id === 'seed-applicant-2')).toBeTruthy();
  expect(rows.some((item: { id?: string }) => item.id === 'seed-applicant')).toBeFalsy();
});

test('agent cannot patch another agents pipeline record', async ({ page }) => {
  await resetSecurity('agent@demo.local');
  await login(page, 'agent@demo.local');
  await expect(page).toHaveURL(/\/$/);
  const response = await page.request.patch('/api/applicants/seed-applicant-2', { data: { status: 'WON' } });
  expect([403, 404]).toContain(response.status());
});
