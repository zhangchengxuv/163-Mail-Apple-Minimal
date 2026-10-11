import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const extensionCss = ['tokens.css', 'common.css', 'toolbar.css', 'reader.css', 'mail-list.css']
  .map((name) => readFileSync(resolve(process.cwd(), 'src/content/theme/styles', name), 'utf8'))
  .join('\n');

// Reproduce the relevant NetEase child frames and !important disabled rule.
// The logged-in, dynamically generated mailbox DOM is not available to CI.
const nativeCss = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; }
  .frame-main-cont-head { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 42px; padding: 0 8px; }
  .nui-toolbar, .nui-toolbar-ext { display: flex; align-items: center; }
  .nui-toolbar-item { margin-right: 6px; }
  .nui-toolbar-item .nui-btn { margin-right: -1px; }
  .nui-btn { display: inline-flex; align-items: center; padding: 0; font: inherit; cursor: pointer; }
  .nui-btn-text, .nui-splitBtn-text, .nui-splitBtn-arr, .nui-select { display: inline-flex; align-items: center; height: 28px; line-height: 26px; padding: 0 8px; border: 1px solid #999; border-radius: 3px; background: white; color: #444; white-space: nowrap; }
  .nui-splitBtn-text { border-right-width: 0; padding-right: 8px; }
  .nui-splitBtn-arr { border-left-width: 0; width: 20px; padding: 0; justify-content: center; }
  .nui-splitBtn-split { width: 1px; height: 18px; background: #aaa; }
  .nui-btn-disabled .nui-btn-text, .nui-splitBtn-text-disabled, .nui-splitBtn-arr-disabled { background: #f0f0f0 !important; border-color: #d8d8d8 !important; color: #ccc !important; }
  .nui-splitBtn-text-disabled { border-right-width: 1px; padding-right: 7px; }
  .nui-splitBtn-arr-disabled { border-left-width: 1px; }
  .nui-roundBtn .nui-btn-text { border-radius: 13px !important; }
  .nui-toolbar-ext .nui-btn { margin-right: -1px; }
  .nui-toolbar-ext .nui-select { margin-right: 10px; }
  .nui-toolbar-ext .settings { margin-left: 10px; }
  .nui-chk { display: inline-flex; width: 18px; justify-content: center; }
`;

type Theme = 'light' | 'dark';
type PageType = 'list' | 'read';

function fixture(theme: Theme, pageType: PageType, fontSize: number): string {
  const list = pageType === 'list' ? ' data-mail-minimal-list' : '';
  const select = pageType === 'list' ? '<div class="nui-toolbar-item"><button class="nui-btn" data-control="select"><span class="nui-btn-text"><span class="nui-chk">□</span>⌄</span></button></div>' : '';
  const action = (label: string, extra = '') => `<div class="nui-toolbar-item"><button class="nui-btn ${extra}"><span class="nui-btn-text">${label}</span></button></div>`;
  const split = (label: string, disabled = false) => `<div class="nui-toolbar-item"><span class="nui-btn nui-splitBtn"><span class="nui-splitBtn-text ${disabled ? 'nui-splitBtn-text-disabled' : ''}">${label}</span><i class="nui-splitBtn-split"></i><button class="nui-splitBtn-arr ${disabled ? 'nui-splitBtn-arr-disabled' : ''}" aria-label="${label}菜单"><span class="nui-ico">⌄</span></button></span></div>`;
  return `<!doctype html><html data-mail-minimal-theme="${theme}" data-mail-minimal-page="${pageType}"${list} style="--mail-minimal-font-size:${fontSize}px"><head><style>${nativeCss}</style><style>${extensionCss}</style></head><body><header class="frame-main-cont-head"><div class="nui-toolbar">${select}${pageType === 'read' ? action('返回') + action('回复') : ''}${action('删除', 'nui-btn-disabled')}${action('举报')}${split('标记为')}${split('移动到', true)}${action('更多')}${pageType === 'list' ? action('刷新') : ''}</div><div class="nui-toolbar-ext"><span class="nui-select">1/2 <span class="nui-select-arr">⌄</span></span><button class="nui-btn nui-roundBtn" aria-label="上一封"><span class="nui-btn-text"><span class="nui-ico-prev">←</span></span></button><button class="nui-btn nui-roundBtn" aria-label="下一封"><span class="nui-btn-text"><span class="nui-ico-next">→</span></span></button><button class="nui-btn nui-roundBtn settings" aria-label="设置"><span class="nui-btn-text">⚙</span></button></div></header></body></html>`;
}

for (const theme of ['light', 'dark'] as const) {
  for (const pageType of ['list', 'read'] as const) {
    test(`${theme} ${pageType}: native compact toolbar states and seams`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      for (const fontSize of [13, 14, 15, 16]) {
        await page.setContent(fixture(theme, pageType, fontSize));
        const metrics = await page.locator('.frame-main-cont-head').evaluate((header) => {
          const controls = [...header.querySelectorAll<HTMLElement>('.nui-toolbar > .nui-toolbar-item > .nui-btn')];
          const frames = [...header.querySelectorAll<HTMLElement>('.nui-btn-text, .nui-splitBtn-text, .nui-splitBtn-arr')];
          return {
            toolbarHeight: header.getBoundingClientRect().height,
            fits: header.scrollWidth <= header.clientWidth,
            fontSizes: [...new Set(frames.map((frame) => getComputedStyle(frame).fontSize))],
            heights: frames.map((frame) => frame.getBoundingClientRect().height),
            gaps: controls.slice(1).map((control, index) => control.getBoundingClientRect().left - controls[index].getBoundingClientRect().right)
          };
        });
        expect(metrics.toolbarHeight).toBe(42);
        expect(metrics.fits).toBe(true);
        expect(metrics.fontSizes).toEqual(['13px']);
        expect(metrics.heights.every((height) => height >= 28 && height <= 30)).toBe(true);
        expect(metrics.gaps.every((gap) => gap >= 0)).toBe(true);
      }

      await page.setContent(fixture(theme, pageType, 16));
      const appearance = await page.locator('.frame-main-cont-head').evaluate((header) => {
        const style = (selector: string) => getComputedStyle(header.querySelector<HTMLElement>(selector)!);
        const normal = style('.nui-toolbar-item .nui-btn:not(.nui-btn-disabled) .nui-btn-text');
        const disabled = style('.nui-btn-disabled .nui-btn-text');
        const splitText = style('.nui-splitBtn-text');
        const splitArrow = style('.nui-splitBtn-arr');
        const disabledSplit = style('.nui-splitBtn-text-disabled');
        const previous = style('.nui-ico-prev').getPropertyValue('color');
        const previousFrame = style('.nui-roundBtn:has(.nui-ico-prev) .nui-btn-text');
        const nextFrame = style('.nui-roundBtn:has(.nui-ico-next) .nui-btn-text');
        const settings = style('.settings .nui-btn-text');
        return {
          normalBackground: normal.backgroundColor, normalColor: normal.color, normalBorder: normal.borderTopColor, normalShadow: normal.boxShadow,
          disabledBackground: disabled.backgroundColor, disabledColor: disabled.color, disabledOpacity: disabled.opacity,
          splitBackground: splitText.backgroundColor, arrowBackground: splitArrow.backgroundColor, splitRight: splitText.borderRightWidth, arrowLeft: splitArrow.borderLeftWidth,
          disabledSplitBackground: disabledSplit.backgroundColor, disabledSplitRight: disabledSplit.borderRightWidth,
          previous, previousRight: previousFrame.borderRightWidth, nextLeft: nextFrame.borderLeftWidth,
          previousRadius: previousFrame.borderTopLeftRadius, nextRadius: nextFrame.borderTopRightRadius, settingsRadius: settings.borderTopLeftRadius
        };
      });
      const expectedBackground = theme === 'light' ? 'rgb(248, 250, 253)' : 'rgb(41, 52, 68)';
      expect(appearance.normalBackground).toBe(expectedBackground);
      expect(appearance.disabledBackground).toBe(expectedBackground);
      expect(appearance.splitBackground).toBe(expectedBackground);
      expect(appearance.arrowBackground).toBe(expectedBackground);
      expect(appearance.disabledSplitBackground).toBe(expectedBackground);
      expect(appearance.normalBorder).toBe(theme === 'light' ? 'rgb(229, 235, 243)' : 'rgb(52, 66, 84)');
      expect(appearance.normalShadow).toBe('none');
      expect(appearance.disabledColor).not.toBe(appearance.normalColor);
      expect(appearance.disabledOpacity).toBe('1');
      expect(appearance.splitRight).toBe('0px');
      expect(appearance.arrowLeft).toBe('0px');
      expect(appearance.disabledSplitRight).toBe('0px');
      expect(appearance.previousRight).toBe('0px');
      expect(appearance.nextLeft).toBe('1px');
      expect(appearance.previousRadius).toBe('7px');
      expect(appearance.nextRadius).toBe('7px');
      expect(appearance.settingsRadius).toBe('7px');

      const regular = page.locator('.nui-toolbar-item .nui-btn:not(.nui-btn-disabled)').first();
      const beforeHover = await regular.locator('.nui-btn-text').evaluate((el) => getComputedStyle(el).backgroundColor);
      await regular.hover();
      const afterHover = await regular.locator('.nui-btn-text').evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(afterHover).not.toBe(beforeHover);
      await page.locator('.frame-main-cont-head').screenshot({ path: testInfo.outputPath(`${theme}-${pageType}-toolbar.png`) });
    });
  }
}

test('theme switching changes colors without shifting native control geometry', async ({ page }) => {
  await page.setContent(fixture('light', 'list', 14));
  const control = page.locator('.nui-toolbar-item .nui-btn-text').first();
  const before = await control.boundingBox();
  await page.locator('html').evaluate((root) => root.setAttribute('data-mail-minimal-theme', 'dark'));
  const after = await control.boundingBox();
  expect(after).toEqual(before);
  expect(await control.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(41, 52, 68)');
});

test('native controls stay separate across desktop widths, zoom levels and selection states', async ({ page }) => {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 1600, 1920]) {
      await page.setViewportSize({ width, height: 720 });
      for (const zoom of [1, 1.25, 1.5]) {
        await page.setContent(fixture(theme, 'list', 16));
        await page.locator('body').evaluate((body, value) => { body.style.zoom = String(value); }, zoom);
        for (const selected of [0, 1, 2]) {
          await page.locator('.nui-toolbar-item:nth-child(2) .nui-btn').evaluate((button, count) => {
            button.classList.toggle('nui-btn-disabled', count === 0);
          }, selected);
          const layout = await page.locator('.frame-main-cont-head').evaluate((header) => {
            const select = header.querySelector<HTMLElement>('[data-control="select"]')!.getBoundingClientRect();
            const deletion = header.querySelector<HTMLElement>('.nui-toolbar-item:nth-child(2) .nui-btn')!.getBoundingClientRect();
            return {
              fits: header.scrollWidth <= header.clientWidth,
              gap: deletion.left - select.right,
              toolbarFont: getComputedStyle(header.querySelector('.nui-toolbar')!).fontSize
            };
          });
          expect(layout.fits).toBe(true);
          expect(layout.gap).toBeGreaterThan(0);
          expect(layout.toolbarFont).toBe('13px');
        }
      }
    }
  }
});
