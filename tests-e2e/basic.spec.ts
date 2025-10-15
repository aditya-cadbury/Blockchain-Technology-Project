import { test, expect } from '@playwright/test';

test('loads homepage and shows key UI elements', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Food Supply Chain DApp')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ship' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Track' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate QR' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set Metadata CID' })).toBeVisible();
});


