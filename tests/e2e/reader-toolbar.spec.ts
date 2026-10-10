import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const styles = ['tokens.css', 'reader.css']
  .map((name) => readFileSync(resolve(process.cwd(), 'src/content/theme/styles', name), 'utf8'))
  .join('\n');

type Theme = 'light' | 'dark';

function pageMarkup(theme: Theme, fontSize: number): string {
  return `<!doctype html>
    <html data-mail-minimal-page="read" data-mail-minimal-theme="${theme}" style="--mail-minimal-font-size: ${fontSize}px">
      <head><style>${styles}
        * { box-sizing: border-box; }
        body { margin: 0; }
        .frame-main-cont-head { inline-size: 760px; display: flex; align-items: center; justify-content: space-between; }
        .nui-toolbar, .nui-toolbar-ext { display: flex; align-items: center; }
        .nui-btn-icon { inline-size: 16px; block-size: 16px; background: currentColor; border-radius: 3px; }
      </style></head>
      <body>
        <main id="_dvModuleContainer_read.ReadModule_1">
          <header class="frame-main-cont-head">
            <div class="nui-toolbar">
              <div class="nui-toolbar-item"><button class="nui-btn"><span class="nui-btn-text">返回</span></button></div>
              <div class="nui-toolbar-item"><button class="nui-btn"><span class="nui-btn-text">回复</span></button></div>
              <div class="nui-toolbar-item"><button class="nui-btn"><span class="nui-btn-text">回复全部</span></button></div>
              <div class="nui-toolbar-item"><button class="nui-btn"><span class="nui-btn-text">转发</span></button></div>
              <div class="nui-toolbar-item"><button class="nui-btn"><span class="nui-btn-text">删除</span></button></div>
              <div class="nui-toolbar-item"><button class="nui-btn" aria-disabled="true"><span class="nui-btn-text">举报</span></button></div>
            </div>
            <div class="nui-toolbar-ext"><button class="nui-roundBtn" aria-label="上一封"><span class="nui-btn-icon"></span></button><button class="nui-roundBtn" aria-label="下一封"><span class="nui-btn-icon"></span></button></div>
          </header>
        </main>
      </body>
    </html>`;
}

async function toolbarMetrics(page: Page) {
  return page.locator('.nui-toolbar .nui-btn').evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    const text = button.querySelector<HTMLElement>('.nui-btn-text')!.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      textCenterOffset: (text.top + text.bottom - rect.top - rect.bottom) / 2
    };
  }));
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} reader toolbar remains compact at all UI font sizes`, async ({ page }, testInfo) => {
    for (const fontSize of [13, 14, 15, 16]) {
      await page.setContent(pageMarkup(theme, fontSize));
      const header = await page.locator('.frame-main-cont-head').boundingBox();
      const buttons = await toolbarMetrics(page);

      expect(header?.height).toBeGreaterThanOrEqual(44);
      expect(header?.height).toBeLessThanOrEqual(48);
      expect(buttons).toHaveLength(6);
      // The fixture contains both short and long labels.  Natural-width controls
      // must therefore not all be stretched to the same width.
      expect(new Set(buttons.map((button) => Math.round(button.width))).size).toBeGreaterThan(1);
      for (const button of buttons) {
        expect(button.height).toBeGreaterThanOrEqual(34);
        expect(button.height).toBeLessThanOrEqual(36);
        expect(Math.abs(button.textCenterOffset)).toBeLessThanOrEqual(2);
      }
    }

    await page.setContent(pageMarkup(theme, 14));
    const firstAction = page.locator('.nui-toolbar .nui-btn').first();
    const disabledAction = page.locator('.nui-toolbar .nui-btn').last();
    const normalBackground = await firstAction.evaluate((button) => getComputedStyle(button).backgroundColor);
    const normalColor = await firstAction.evaluate((button) => getComputedStyle(button).color);
    await firstAction.hover();
    const hoverBackground = await firstAction.evaluate((button) => getComputedStyle(button).backgroundColor);
    const disabledColor = await disabledAction.evaluate((button) => getComputedStyle(button).color);

    expect(hoverBackground).not.toBe(normalBackground);
    expect(disabledColor).not.toBe(normalColor);
    await page.screenshot({ path: testInfo.outputPath(`reader-toolbar-${theme}.png`) });
  });
}
