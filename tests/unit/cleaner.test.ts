import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyCleaner } from '../../src/content/cleaner';
import { DEFAULT_SETTINGS, HIDDEN_ATTRIBUTE } from '../../src/shared/constants';

const fixture = readFileSync(resolve('tests/fixtures/mail-shell.html'), 'utf8');

describe('Cleaner', () => {
  it('hides only verified promotions and preserves functional mail controls', () => {
    document.body.innerHTML = fixture;
    applyCleaner({ ...DEFAULT_SETTINGS }, 'list');
    expect(document.querySelector('#dvNavFoot')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(document.querySelector('[role="tab"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(document.querySelector('input[aria-label="搜索邮件"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('#dvNavTop li:last-child')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('.rF0')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
  });

  it('restores all cleaner changes when disabled', () => {
    document.body.innerHTML = fixture;
    applyCleaner({ ...DEFAULT_SETTINGS }, 'list');
    applyCleaner({ ...DEFAULT_SETTINGS, cleanerEnabled: false }, 'list');
    expect(document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)).toHaveLength(0);
  });

  it('does not remove a mail row whose subject contains AI', () => {
    document.body.innerHTML = fixture;
    applyCleaner({ ...DEFAULT_SETTINGS, hideAi: true }, 'list');
    expect(document.querySelector('.rF0')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
  });
});
