import { test, expect } from '@playwright/test';

test('popup document renders its settings controls', async ({ page }) => {
  await page.addInitScript(() => {
    let settings: Record<string, unknown> = {};
    // Minimal storage double for popup integration behavior.
    Object.defineProperty(window, 'chrome', { value: { storage: { sync: {
      get: async (key: string) => ({ [key]: settings[key] }),
      set: async (next: Record<string, unknown>) => { settings = { ...settings, ...next }; }
    } }, tabs: { query: async () => [{ url: 'https://mail.163.com/' }] } } });
  });
  await page.goto('/src/popup/index.html');
  await expect(page.getByText('163 Mail Minimal')).toBeVisible();
  await expect(page.locator('[data-setting="cleanerEnabled"]')).toBeVisible();
  await page.locator('[data-setting="cleanerEnabled"]').click();
  await expect(page.locator('[data-setting="hideAds"]')).toBeDisabled();
});
