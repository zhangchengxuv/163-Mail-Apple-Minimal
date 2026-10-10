import { describe, expect, it } from 'vitest';
import { detectPage } from '../../src/content/page-detector';

describe('SPA page detector', () => {
  it('returns to list when a previous ReadModule remains hidden in the DOM', () => {
    document.body.innerHTML = `
      <div id="_dvModuleContainer_read.ReadModule_1" style="display:none"></div>
      <div id="dvNavContainer" class="frame-nav"></div>
      <div id="dvContentContainer" class="frame-main-outer"></div>`;
    expect(detectPage(document, 'https://mail.163.com/js6/main.jsp#module=mbox.ListModule')).toBe('list');
  });

  it('identifies a visible reader module without affecting list detection', () => {
    document.body.innerHTML = '<div id="_dvModuleContainer_read.ReadModule_1"></div>';
    expect(detectPage(document, 'https://mail.163.com/js6/main.jsp')).toBe('read');
  });
});
