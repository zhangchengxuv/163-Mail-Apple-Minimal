import { describe, expect, it } from 'vitest';
import { syncReaderChrome } from '../../src/content/theme/reader-chrome';

describe('reader quick-reply chrome', () => {
  it('marks only the light quick-reply surface in a dark reader', () => {
    document.body.innerHTML = `
      <div id="_dvModuleContainer_read.ReadModule_1">
        <div id="message-body" style="background: white">Original message body</div>
        <div id="quick-reply" style="background: rgb(255, 255, 255)"><span>Quick reply to: example recipient</span></div>
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

  it('hides only the verified quick-reply surface when the setting is disabled', () => {
    document.body.innerHTML = `
      <div id="_dvModuleContainer_read.ReadModule_1">
        <div id="message-body" style="background: rgb(255, 255, 255)">Original mail body</div>
        <div id="quick-reply" style="background: rgb(255, 255, 255)">Quick reply to: example recipient</div>
      </div>`;

    syncReaderChrome(document, 'read', true, false);

    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply-hidden')).toBe(true);
    expect(document.querySelector('#message-body')?.hasAttribute('data-mail-minimal-reader-quick-reply-hidden')).toBe(false);

    syncReaderChrome(document, 'read', true, true);
    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply-hidden')).toBe(false);
    expect(document.querySelector('#quick-reply')?.hasAttribute('data-mail-minimal-reader-quick-reply')).toBe(true);
  });

  it('frames only the outer iframe surface and never marks the iframe document', () => {
    document.body.innerHTML = `
      <div id="_dvModuleContainer_read.ReadModule_1">
        <div id="mail-surface" style="background: rgb(255, 255, 255)"><iframe id="mail-frame"></iframe></div>
      </div>`;

    syncReaderChrome(document, 'read', true);

    expect(document.querySelector('#mail-surface')?.hasAttribute('data-mail-minimal-reader-message-surface')).toBe(true);
    expect(document.querySelector('#mail-frame')?.hasAttribute('data-mail-minimal-reader-message-surface')).toBe(false);
  });
});
