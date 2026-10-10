import { describe, expect, it } from 'vitest';
import { applyCleaner } from '../../src/content/cleaner';
import { DEFAULT_SETTINGS, HIDDEN_ATTRIBUTE } from '../../src/shared/constants';

describe('welcome cleaner', () => {
  it('hides a stable AI module without touching a normal mail-shaped link', () => {
    document.body.innerHTML = '<main id="dvContentContainer"><section data-module="ai-assistant"><input placeholder="搜索邮件"></section><a role="link">AI 项目周报</a></main>';
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');
    expect(document.querySelector('[data-module="ai-assistant"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(document.querySelector('[role="link"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[data-mail-minimal-card="today"]')?.textContent).toContain('今日概览');
  });

  it('uses the native inbox item once for default homepage mode', () => {
    document.body.innerHTML = '<nav id="dvNavContainer"><button role="button">收件箱</button></nav>';
    const inbox = document.querySelector<HTMLButtonElement>('[role="button"]')!;
    let clicks = 0;
    inbox.addEventListener('click', () => { clicks += 1; });
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'inbox' }, 'welcome');
    expect(clicks).toBe(1);
  });

  it('hides a compact advert badge card even when its close glyph is present', () => {
    document.body.innerHTML = '<main id="dvContentContainer"><section id="banner"><span id="badge">广告×</span></section></main>';
    const banner = document.querySelector('#banner')!;
    const badge = document.querySelector('#badge')!;
    Object.defineProperty(badge, 'getBoundingClientRect', { value: () => ({ width: 45, height: 20 }) });
    Object.defineProperty(banner, 'getBoundingClientRect', { value: () => ({ width: 600, height: 220 }) });
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');
    expect(banner.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
  });

  it('leaves the original welcome page untouched and removes the Today card', () => {
    document.body.innerHTML = '<main id="dvContentContainer"><section data-module="ai-assistant"></section></main>';
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'original-home' }, 'welcome');
    expect(document.querySelector('[data-module="ai-assistant"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[data-mail-minimal-card="today"]')).toBeNull();
  });
});
