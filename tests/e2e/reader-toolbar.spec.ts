import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const styles = ['tokens.css', 'reader.css', 'mail-list.css']
  .map((name) => readFileSync(resolve(process.cwd(), 'src/content/theme/styles', name), 'utf8'))
  .join('\n');

type Theme = 'light' | 'dark';

function pageMarkup(theme: Theme, fontSize: number, pageType: 'read' | 'list'): string {
  const listAttribute = pageType === 'list' ? ' data-mail-minimal-list' : '';
  return `<!doctype html>
    <html data-mail-minimal-page="${pageType}" data-mail-minimal-theme="${theme}"${listAttribute} style="--mail-minimal-font-size: ${fontSize}px">
      <head><style>${styles}
        * { box-sizing: border-box; }
        body { margin: 0; }
        .frame-main-cont-head { inline-size: 100%; min-inline-size: 0; display: flex; align-items: center; justify-content: space-between; }
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
              <div class="nui-toolbar-item"><span class="nui-btn nui-splitBtn"><span class="nui-splitBtn-text">标记为</span><i class="nui-splitBtn-split"></i><button class="nui-splitBtn-arr" aria-label="展开标记菜单"><span class="nui-ico">⌄</span></button></span></div>
              <div class="nui-toolbar-item"><span class="nui-btn nui-splitBtn"><span class="nui-splitBtn-text nui-splitBtn-text-disabled">移动到</span><i class="nui-splitBtn-split"></i><button class="nui-splitBtn-arr nui-splitBtn-arr-disabled" aria-label="展开移动菜单"><span class="nui-ico">⌄</span></button></span></div>
            </div>
            <div class="nui-toolbar-ext"><span class="nui-select"><span class="nui-select-text">1 / 2</span><span class="nui-select-arr">⌄</span></span><button class="nui-roundBtn" aria-label="上一封"><span class="nui-btn-icon"></span></button><button class="nui-roundBtn" aria-label="下一封"><span class="nui-btn-icon"></span></button></div>
          </header>
        </main>
      </body>
    </html>`;
}

async function toolbarMetrics(page: Page) {
  return page.locator('.nui-toolbar .nui-btn:not(.nui-splitBtn)').evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    const text = button.querySelector<HTMLElement>('.nui-btn-text')!.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      textCenterOffset: (text.top + text.bottom - rect.top - rect.bottom) / 2
    };
  }));
}

for (const pageType of ['read', 'list'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} ${pageType} toolbar remains compact at all UI font sizes`, async ({ page }, testInfo) => {
    for (const fontSize of [13, 14, 15, 16]) {
      await page.setContent(pageMarkup(theme, fontSize, pageType));
      const header = await page.locator('.frame-main-cont-head').boundingBox();
      const buttons = await toolbarMetrics(page);

      expect(header?.height).toBeGreaterThanOrEqual(40);
      expect(header?.height).toBeLessThanOrEqual(44);
      expect(buttons).toHaveLength(6);
      // The fixture contains both short and long labels.  Natural-width controls
      // must therefore not all be stretched to the same width.
      expect(new Set(buttons.map((button) => Math.round(button.width))).size).toBeGreaterThan(1);
      for (const button of buttons) {
        expect(button.height).toBeGreaterThanOrEqual(30);
        expect(button.height).toBeLessThanOrEqual(32);
        expect(Math.abs(button.textCenterOffset)).toBeLessThanOrEqual(2);
      }
    }

    await page.setContent(pageMarkup(theme, 14, pageType));
    const firstAction = page.locator('.nui-toolbar .nui-btn').first();
    const disabledAction = page.locator('.nui-toolbar .nui-btn').last();
    const normalBackground = await firstAction.evaluate((button) => getComputedStyle(button).backgroundColor);
    const normalColor = await firstAction.evaluate((button) => getComputedStyle(button).color);
    await firstAction.hover();
    const hoverBackground = await firstAction.evaluate((button) => getComputedStyle(button).backgroundColor);
    const disabledColor = await disabledAction.evaluate((button) => getComputedStyle(button).color);

    expect(hoverBackground).not.toBe(normalBackground);
    expect(disabledColor).not.toBe(normalColor);

    const splitMetrics = await page.locator('.nui-splitBtn').evaluateAll((splits) => splits.map((split) => {
      const text = split.querySelector<HTMLElement>('.nui-splitBtn-text')!;
      const arrow = split.querySelector<HTMLElement>('.nui-splitBtn-arr')!;
      const root = split.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const arrowRect = arrow.getBoundingClientRect();
      return {
        rootHeight: root.height,
        textHeight: textRect.height,
        arrowHeight: arrowRect.height,
        joinGap: arrowRect.left - textRect.right,
        textBackground: getComputedStyle(text).backgroundColor,
        arrowBackground: getComputedStyle(arrow).backgroundColor,
        rootColor: getComputedStyle(split).color,
        textColor: getComputedStyle(text).color
      };
    }));
    expect(splitMetrics).toHaveLength(2);
    for (const split of splitMetrics) {
      expect(split.rootHeight).toBeGreaterThanOrEqual(30);
      expect(split.rootHeight).toBeLessThanOrEqual(32);
      // The one-pixel outer frame leaves a 30px content box inside the visual
      // button, so both split children must fill that inner box.
      expect(split.rootHeight - split.textHeight).toBeLessThanOrEqual(2);
      expect(split.rootHeight - split.arrowHeight).toBeLessThanOrEqual(2);
      expect(Math.abs(split.joinGap)).toBeLessThanOrEqual(2);
      expect(split.textBackground).toBe('rgba(0, 0, 0, 0)');
      expect(split.arrowBackground).toBe('rgba(0, 0, 0, 0)');
    }
    expect(splitMetrics[1].textColor).not.toBe(splitMetrics[0].textColor);

    const selectMetrics = await page.locator('.nui-toolbar-ext .nui-select').evaluate((select) => {
      const styles = getComputedStyle(select);
      return { height: select.getBoundingClientRect().height, background: styles.backgroundColor, fontSize: styles.fontSize };
    });
    expect(selectMetrics.height).toBeGreaterThanOrEqual(30);
    expect(selectMetrics.height).toBeLessThanOrEqual(32);
    expect(selectMetrics.fontSize).toBe('13px');

    for (const viewportWidth of [1280, 1600, 1920]) {
      for (const zoom of [1, 1.25, 1.5]) {
        await page.setViewportSize({ width: viewportWidth, height: 720 });
        await page.setContent(pageMarkup(theme, 16, pageType));
        await page.evaluate((value) => { document.body.style.zoom = String(value); }, zoom);
        const layout = await page.locator('.frame-main-cont-head').evaluate((header) => ({
          scrollWidth: header.scrollWidth,
          clientWidth: header.clientWidth,
          toolbarFontSize: getComputedStyle(header.querySelector('.nui-toolbar')!).fontSize,
          buttonMinHeight: getComputedStyle(header.querySelector('.nui-btn')!).minHeight
        }));
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
        expect(layout.toolbarFontSize).toBe('13px');
        expect(layout.buttonMinHeight).toBe('30px');
      }
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.setContent(pageMarkup(theme, 14, pageType));
    await page.screenshot({ path: testInfo.outputPath(`${pageType}-toolbar-${theme}.png`) });
    });
  }
}
