import { describe, expect, it } from 'vitest';
import { applyTheme } from '../../src/content/theme';
import { DEFAULT_SETTINGS, PAGE_ATTRIBUTE, THEME_ATTRIBUTE } from '../../src/shared/constants';
import { resolveThemeMode } from '../../src/shared/theme-mode';

describe('Theme manager', () => {
  it('updates a single page scope and accent token', () => {
    applyTheme({ ...DEFAULT_SETTINGS, accentColor: 'graphite' }, 'compose');
    expect(document.documentElement.getAttribute(PAGE_ATTRIBUTE)).toBe('compose');
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(true);
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--mail-minimal-accent')).toBe('#596273');
    expect(document.documentElement.style.getPropertyValue('--mail-minimal-font-size')).toBe('14px');
  });

  it('turns off all theme styling without leaving a stale attribute', () => {
    applyTheme({ ...DEFAULT_SETTINGS, themeEnabled: false }, 'list');
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--mail-minimal-font-size')).toBe('');
  });

  it('resolves light, dark, and system modes without changing the active page', () => {
    const marker = document.createElement('div');
    marker.id = 'compose-contact-panel';
    document.body.append(marker);

    applyTheme({ ...DEFAULT_SETTINGS, themeMode: 'dark' }, 'compose', document.documentElement, 'dark');
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    expect(document.documentElement.getAttribute(PAGE_ATTRIBUTE)).toBe('compose');
    expect(document.querySelector('#compose-contact-panel')).toBe(marker);

    applyTheme({ ...DEFAULT_SETTINGS, themeMode: 'system' }, 'compose', document.documentElement, 'light');
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('light');
    expect(resolveThemeMode('light', true)).toBe('light');
    expect(resolveThemeMode('dark', false)).toBe('dark');
    expect(resolveThemeMode('system', true)).toBe('dark');
    expect(resolveThemeMode('system', false)).toBe('light');
  });

  it('updates the UI font token without touching mailbox content', () => {
    const message = document.createElement('article');
    message.textContent = 'Original message body';
    document.body.append(message);
    applyTheme({ ...DEFAULT_SETTINGS, uiFontSize: 16 }, 'list', document.documentElement, 'dark');
    expect(document.documentElement.style.getPropertyValue('--mail-minimal-font-size')).toBe('16px');
    expect(message.textContent).toBe('Original message body');
  });
});
