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
  await expect(page.locator('input[name="themeMode"][value="system"]')).toBeChecked();
  await page.locator('input[name="themeMode"][value="dark"]').check();
  await expect(page.locator('html')).toHaveAttribute('data-mail-minimal-theme', 'dark');
});

test('system appearance resolves to dark for popup and options without changing the setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    let settings: Record<string, unknown> = {};
    Object.defineProperty(window, 'chrome', { value: { storage: { sync: {
      get: async (key: string) => ({ [key]: settings[key] }), set: async (next: Record<string, unknown>) => { settings = { ...settings, ...next }; }
    } }, tabs: { query: async () => [{ id: 1, url: 'https://mail.163.com/js6/' }], sendMessage: async () => ({ ready: true, page: 'welcome' }) }, runtime: { getURL: (path: string) => path, openOptionsPage: async () => undefined } } });
  });
  await page.goto('/src/popup/index.html');
  await expect(page.locator('input[name="themeMode"][value="system"]')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-mail-minimal-theme', 'dark');
  await page.goto('/src/options/index.html');
  await expect(page.locator('input[name="themeMode"][value="system"]')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-mail-minimal-theme', 'dark');
});

test('options persist a manually selected weather city', async ({ page }) => {
  await page.addInitScript(() => {
    let settings: Record<string, unknown> = {};
    let local: Record<string, unknown> = {};
    Object.defineProperty(window, 'chrome', { value: { storage: { sync: {
      get: async (key: string) => ({ [key]: settings[key] }),
      set: async (next: Record<string, unknown>) => { settings = { ...settings, ...next }; }
    }, local: {
      get: async (key: string) => ({ [key]: local[key] }),
      set: async (next: Record<string, unknown>) => { local = { ...local, ...next }; }
    } }, runtime: { getURL: (path: string) => path } } });
  });
  await page.goto('/src/options/index.html');
  await expect(page.getByText('天气', { exact: true })).toBeVisible();
  const city = page.getByLabel('天气城市');
  await expect(city).toHaveValue('Tokyo');
  await city.fill('Singapore');
  await city.press('Tab');
  await expect(city).toHaveValue('Singapore');
});

test('options only requests and saves current position after an explicit click', async ({ page }) => {
  await page.addInitScript(() => {
    let settings: Record<string, unknown> = {};
    let local: Record<string, unknown> = {};
    Object.defineProperty(window, 'chrome', { value: { storage: { sync: {
      get: async (key: string) => ({ [key]: settings[key] }),
      set: async (next: Record<string, unknown>) => { settings = { ...settings, ...next }; }
    }, local: {
      get: async (key: string) => ({ [key]: local[key] }),
      set: async (next: Record<string, unknown>) => { local = { ...local, ...next }; }
    } }, runtime: { getURL: (path: string) => path } } });
    Object.defineProperty(window.navigator, 'geolocation', { value: {
      getCurrentPosition: (success: (position: GeolocationPosition) => void) => success({
        coords: { latitude: 1.3521, longitude: 103.8198 }
      } as GeolocationPosition)
    } });
  });
  await page.goto('/src/options/index.html');
  await expect(page.getByRole('button', { name: '使用当前位置' })).toBeVisible();
  await page.getByRole('button', { name: '使用当前位置' }).click();
  await expect(page.getByText('当前位置已保存，仅保存在本机')).toBeVisible();
  await expect(page.locator('input[name="weatherLocationMode"][value="geolocation"]')).toBeChecked();
});
