import { test, expect } from '@playwright/test';

/**
 * Task 23.3 — Visual regression at 1440×1024.
 *
 * Baselines are generated on first run (`--update-snapshots`) and compared on
 * subsequent runs. These capture the dark Spec Observatory relationship canvas
 * and the light Archive Ledger table as the visual source of truth for this
 * build. (Pixel-for-pixel comparison against the original prototype images
 * would require committing those references; these baselines lock the app's
 * own rendering so future changes surface as diffs.)
 */

test.use({ viewport: { width: 1440, height: 1024 } });

test('dark relationship canvas @ 1440×1024', async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.spec-node');
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'dark');
  // Let React Flow settle its fitView transform before snapshotting.
  await page.waitForTimeout(400);
  await expect(page).toHaveScreenshot('relationship-dark.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});

test('light archive table @ 1440×1024', async ({ page }) => {
  await page.goto('/preview.html?view=archive&mode=light', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.archive-row');
  await expect(page.locator('.app-root')).toHaveAttribute('data-theme', 'light');
  await page.waitForTimeout(200);
  await expect(page).toHaveScreenshot('archive-light.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
