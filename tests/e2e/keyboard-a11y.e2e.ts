import { test, expect } from '@playwright/test';

/**
 * Task 23.1 — Keyboard navigation and accessibility.
 * Runs against the preview harness (full <App/> + mock API).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/preview.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.relationship-view');
  await page.waitForSelector('.spec-node');
});

test('roving arrow-key navigation selects nodes and opens the detail rail', async ({ page }) => {
  // The graph view container is the roving-focus host (tabIndex=0, role=application).
  const view = page.locator('.relationship-view');
  await view.focus();

  // No selection / detail rail initially.
  await expect(page.locator('.detail-panel')).toHaveCount(0);

  // ArrowDown selects the first spec and opens the detail rail.
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.spec-node--selected')).toHaveCount(1);
  await expect(page.locator('.detail-panel')).toBeVisible();

  const selectedTitle = () =>
    page.locator('.spec-node--selected .spec-node__title').innerText();
  const firstTitle = await selectedTitle();

  // ArrowDown again moves the selection to a different spec (assert on the
  // node's own title, which updates synchronously with selection — the detail
  // rail title loads asynchronously and would race).
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.spec-node--selected')).toHaveCount(1);
  await expect
    .poll(async () => selectedTitle())
    .not.toBe(firstTitle);

  // Home returns to the first spec; End jumps to the last.
  await page.keyboard.press('Home');
  await expect
    .poll(async () => selectedTitle())
    .toBe(firstTitle);
  await page.keyboard.press('End');
  await expect(page.locator('.spec-node--selected')).toHaveCount(1);
});

test('Enter/Space on a focused node selects it', async ({ page }) => {
  const firstNode = page.locator('.spec-node').first();
  await firstNode.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-panel')).toBeVisible();
  await expect(firstNode).toHaveAttribute('aria-pressed', 'true');
});

test('filter controls are reachable and focusable in order', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: /search specifications/i });
  await search.focus();
  await expect(search).toBeFocused();

  // Tabbing forward reaches the interactive filter controls (buttons/selects).
  await page.keyboard.press('Tab');
  const active = await page.evaluate(() => document.activeElement?.tagName ?? '');
  expect(['BUTTON', 'SELECT', 'INPUT']).toContain(active);
});

test('keyboard focus shows a visible focus ring', async ({ page }) => {
  // Tab into the chrome; the focused control should have a non-zero outline
  // (our :focus-visible rule sets a 2px outline — a visible focus indicator).
  await page.locator('body').press('Tab');
  const outlineWidth = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return '0px';
    return getComputedStyle(el).outlineWidth;
  });
  expect(outlineWidth).not.toBe('0px');
});
