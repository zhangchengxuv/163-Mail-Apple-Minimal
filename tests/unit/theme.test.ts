import { describe, expect, it } from 'vitest';
import { applyTheme } from '../../src/content/theme';
import { DEFAULT_SETTINGS, PAGE_ATTRIBUTE, THEME_ATTRIBUTE } from '../../src/shared/constants';

describe('Theme manager', () => {
  it('updates a single page scope and accent token', () => {
    applyTheme({ ...DEFAULT_SETTINGS, accentColor: 'graphite' }, 'compose');
    expect(document.documentElement.getAttribute(PAGE_ATTRIBUTE)).toBe('compose');
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--mail-minimal-accent')).toBe('#596273');
  });

  it('turns off all theme styling without leaving a stale attribute', () => {
    applyTheme({ ...DEFAULT_SETTINGS, themeEnabled: false }, 'list');
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
  });
});
