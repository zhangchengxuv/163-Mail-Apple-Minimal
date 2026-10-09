import { test, expect } from '@playwright/test';

test('popup document renders its settings controls', async ({ page }) => {
  await page.addInitScript(() => {
    let settings: Record<string, unknown> = {};
    // Minimal storage double for popup integration behavior.
    Object.defineProperty(window, 'chrome', { value: { storage: { sync: {
      get: async (key: string) => ({ [key]: settings[key] }),
      set: async (next: Record<string, unknown>) => { settings = { ...settings, ...next }; }
    } }, tabs: { query: async () => [{ id: 1, url: 'https://mail.163.com/js6/' }], sendMessage: async () => ({ ready: true, page: 'list' }) }, runtime: { getURL: (path: string) => path, openOptionsPage: async () => undefined } } });
  });
  await page.goto('/src/popup/index.html');
  await expect(page.getByText('163 Mail Minimal')).toBeVisible();
  await expect(page.getByText('已连接 · 邮件列表')).toBeVisible();
  await expect(page.locator('[data-setting="cleanerEnabled"]')).toBeVisible();
  await page.locator('[data-setting="cleanerEnabled"]').click();
  await expect(page.locator('[data-setting="cleanerEnabled"]')).not.toBeChecked();
});
