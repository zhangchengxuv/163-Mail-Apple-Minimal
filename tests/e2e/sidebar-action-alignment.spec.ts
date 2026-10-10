import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const styles = ['tokens.css', 'sidebar.css']
  .map((name) => readFileSync(resolve(process.cwd(), 'src/content/theme/styles', name), 'utf8'))
  .join('\n');

type Theme = 'light' | 'dark';

function pageMarkup(theme: Theme, fontSize: number): string {
  return `<!doctype html>
    <html data-mail-minimal-sidebar data-mail-minimal-theme="${theme}" style="--mail-minimal-font-size: ${fontSize}px">
      <head><style>${styles}
        * { box-sizing: border-box; }
        body { margin: 0; }
        #dvNavContainer { inline-size: 220px; }
        .nui-ico { display: block; background: currentColor; border-radius: 3px; }
      </style></head>
      <body>
        <nav id="dvNavContainer" class="frame-nav">
          <div id="dvNavTop">
            <div class="qd0"></div>
            <ul class="tJ0">
              <li class="ra0 nb0" role="button" tabindex="0"><span class="om0"><b class="nui-ico fn-bg hC0"></b></span><span class="oz0">收信</span></li>
              <li class="ra0 mD0" role="button" tabindex="0"><span class="om0"><b class="nui-ico fn-bg ga0"></b></span><span class="oz0">写信</span></li>
            </ul>
          </div>
          <div id="dvNavTree">
            <div class="nui-tree-item-label nui-tree-item-label-selected"><span class="nui-tree-item-text">收件箱</span><span class="nui-tree-item-count">(2)</span></div>
            <div class="nui-tree-item-label"><span class="nui-tree-item-text">草稿箱</span></div>
          </div>
        </nav>
      </body>
    </html>`;
}

async function actionMetrics(page: Page) {
  return page.locator('#dvNavTop li[role="button"]').evaluateAll((buttons) => buttons.map((button) => {
    const icon = button.querySelector<HTMLElement>('.om0')!;
    const label = button.querySelector<HTMLElement>('.oz0')!;
    const buttonRect = button.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const contentLeft = Math.min(iconRect.left, labelRect.left);
    const contentRight = Math.max(iconRect.right, labelRect.right);
    return {
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      iconTop: iconRect.top,
      iconBottom: iconRect.bottom,
      labelTop: labelRect.top,
      labelBottom: labelRect.bottom,
      offset: (contentLeft + contentRight) / 2 - (buttonRect.left + buttonRect.right) / 2
    };
  }));
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} sidebar action content is centered across UI font sizes`, async ({ page }, testInfo) => {
    const measurements: Array<{ fontSize: number; actions: Awaited<ReturnType<typeof actionMetrics>> }> = [];
    for (const fontSize of [13, 14, 15, 16]) {
      await page.setContent(pageMarkup(theme, fontSize));
      const metrics = await actionMetrics(page);
      measurements.push({ fontSize, actions: metrics });
      expect(metrics).toHaveLength(2);
      expect(Math.abs(metrics[0].buttonWidth - metrics[1].buttonWidth)).toBeLessThanOrEqual(0.01);

      for (const metric of metrics) {
        expect(Math.abs(metric.offset)).toBeLessThanOrEqual(2);
        expect(metric.buttonHeight).toBeGreaterThanOrEqual(40);
        expect(Math.abs((metric.iconTop + metric.iconBottom) / 2 - (metric.labelTop + metric.labelBottom) / 2)).toBeLessThanOrEqual(2);
      }
    }

    await page.setContent(pageMarkup(theme, 14));
    const selected = page.locator('.nui-tree-item-label-selected');
    const selectedText = selected.locator('.nui-tree-item-text');
    const selectedColor = await selected.evaluate((element) => getComputedStyle(element).color);
    const selectedBackground = await selected.evaluate((element) => getComputedStyle(element).backgroundColor);
    const textColor = await selectedText.evaluate((element) => getComputedStyle(element).color);
    const selectedGeometry = await selected.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const text = element.querySelector<HTMLElement>('.nui-tree-item-text')!.getBoundingClientRect();
      const topActions = element.ownerDocument.querySelector('#dvNavTop')!.getBoundingClientRect();
      return {
        height: rect.height,
        gapFromActions: rect.top - topActions.bottom,
        textIsAboveLabel: element.ownerDocument.elementFromPoint((text.left + text.right) / 2, (text.top + text.bottom) / 2) === element.querySelector('.nui-tree-item-text')
      };
    });
    expect(textColor).toBe(selectedColor);
    expect(selectedBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(selectedGeometry.height).toBeGreaterThanOrEqual(28);
    expect(selectedGeometry.gapFromActions).toBeGreaterThanOrEqual(6);
    expect(selectedGeometry.textIsAboveLabel).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`sidebar-actions-${theme}.png`) });
    await testInfo.attach('alignment-metrics.json', {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json'
    });
  });
}
