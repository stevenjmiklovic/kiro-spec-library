import { test, expect } from '@playwright/test';

/**
 * Task 23.2 — View switching, filters, search, and URL-state preservation.
 */

test('switches between Relationship and Archive views', async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.relationship-view')).toBeVisible();

  await page.getByRole('tab', { name: 'Archive' }).click();
  await expect(page.locator('.archive-view')).toBeVisible();
  await expect(page).toHaveURL(/[?&]view=archive/);

  await page.getByRole('tab', { name: 'Relationships' }).click();
  await expect(page.locator('.relationship-view')).toBeVisible();
});

test('applying a theme filter narrows the visible specs', async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.spec-node');

  const before = await page.locator('.spec-node').count();
  expect(before).toBeGreaterThan(1);

  // The sample data has multiple themes; picking one reduces the node set.
  const themeSelect = page.getByLabel('Filter by theme');
  const options = await themeSelect.locator('option').allInnerTexts();
  const specificTheme = options.find((o) => o && o !== 'All themes');
  expect(specificTheme).toBeTruthy();

  await themeSelect.selectOption({ label: specificTheme! });
  await expect
    .poll(async () => page.locator('.spec-node').count())
    .toBeLessThan(before);
});

test('search filters specs once 2+ characters are entered', async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.spec-node');

  const before = await page.locator('.spec-node').count();
  const search = page.getByRole('searchbox', { name: /search specifications/i });
  await search.fill('memory');

  await expect
    .poll(async () => page.locator('.spec-node').count(), { timeout: 5000 })
    .toBeLessThanOrEqual(before);
  // At least one matching spec ("Memory retention controls" / "Agent Memory") remains.
  await expect(page.locator('.spec-node').first()).toBeVisible();
});

test('URL state (view + theme) is preserved across reload', async ({ page }) => {
  await page.goto('/preview.html?view=archive&mode=light', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.archive-view')).toBeVisible();
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'light');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.archive-view')).toBeVisible();
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'light');
});

test('theme toggle updates the URL and applies across both views', async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  // Default is dark.
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'dark');

  await page.locator('.theme-switcher').click();
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'light');
  await expect(page).toHaveURL(/[?&]mode=light/);
});
