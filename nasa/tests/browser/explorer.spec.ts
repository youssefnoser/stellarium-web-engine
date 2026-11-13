import { test, expect } from '@playwright/test';

test('Sky controls and band selection work without hydration errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('slider', { name: 'Observation frame' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose infrared bands' }).click();
  await page.getByRole('button', { name: 'Band stacking', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Stack band count' }).fill('7');
  await expect(page.locator('#band-status')).toContainText(/Stacking bands 1.*7/);
  await page.getByRole('button', { name: 'Select detector bands' }).click();
  await page.getByRole('checkbox', { name: 'Detector 1, local band 2, global band 2', exact: true }).check();
  await expect(page.locator('#band-status')).toContainText('2 individual bands');
  await page.getByRole('button', { name: 'Close band selection' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/demo-mobile.png' });
  expect(errors).toEqual([]);
});


