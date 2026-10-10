import { describe, expect, it } from 'vitest';
import { syncReaderChrome } from '../../src/content/theme/reader-chrome';

describe('reader quick-reply chrome', () => {
  it('marks only the light quick-reply surface in a dark reader', () => {
    document.body.innerHTML = `
      <div id="_dvModuleContainer_read.ReadModule_1">
        <div id="message-body" style="background: white">Original message body</div>
        <div id="quick-reply" style="background: rgb(255, 255, 255)"><span>快捷回复给：示例收件人</span></div>
      </div>`;

    syncReaderChrome(document, 'read', true);

    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply')).toBe(true);
    expect(document.querySelector('#message-body')?.hasAttribute('data-mail-minimal-reader-quick-reply')).toBe(false);
  });

  it('removes the marker outside a dark reader', () => {
    document.body.innerHTML = '<div id="quick-reply" data-mail-minimal-reader-quick-reply></div>';

    syncReaderChrome(document, 'list', false);

    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply')).toBe(false);
  });

  it('keeps an existing marker without rescanning a stable dark reader', () => {
    document.body.innerHTML = '<div id="_dvModuleContainer_read.ReadModule_1"><div id="quick-reply" data-mail-minimal-reader-quick-reply></div></div>';

    syncReaderChrome(document, 'read', true);

    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply')).toBe(true);
  });
});
