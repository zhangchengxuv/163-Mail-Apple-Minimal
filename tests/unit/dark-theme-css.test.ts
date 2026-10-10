import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readStyle = (name: string): string => readFileSync(resolve(process.cwd(), 'src/content/theme/styles', name), 'utf8');
const readPopupStyle = (): string => readFileSync(resolve(process.cwd(), 'src/popup/popup.css'), 'utf8');

describe('dark theme CSS regression boundaries', () => {
  it('uses one dark token palette without an inversion or overlay filter', () => {
    const css = readStyle('tokens.css');
    expect(css).toContain('--mail-bg: #151a21');
    expect(css).toContain('--mail-surface: #202a36');
    expect(css).toContain('--mail-sidebar: #182231');
    expect(css).toContain('--mail-text-primary: #edf2f8');
    expect(css).not.toMatch(/filter:\s*invert/i);
  });

  it('styles only the verified welcome roots and keeps Today in normal flow', () => {
    const css = readStyle('welcome.css');
    expect(css).toContain('[id$="_dvInfoPanel"]');
    expect(css).toContain('[id$="_dvMemberCenter"]');
    expect(css).toContain('--mail-minimal-page-bg');
    expect(css).not.toMatch(/position:\s*(absolute|fixed)/i);
  });

  it('keeps native mail-row layers continuous and avoids bright separators', () => {
    const css = readStyle('mail-list.css');
    expect(css).toContain(':is(.nl0, .hV0, .im0)');
    expect(css).toContain('border-bottom-color: color-mix');
    expect(css).toContain('background: var(--mail-control)');
    expect(css).toContain('.nui-btn-text');
  });

  it('uses one shared search surface without a nested input background in either theme', () => {
    const css = readStyle('header.css');
    expect(css).toContain('background: #18212c');
    expect(css).toContain('color: #eef4fc');
    expect(css).toContain('.nui-ipt-placeholder');
    expect(css).toContain('[role="search"].sU0');
    expect(css).toContain('.sU0 .ru0');
    expect(css).toContain('box-sizing: border-box !important');
    expect(css).toContain('background: transparent !important');
  });

  it('gives sidebar primary actions separate light and dark tokens with font-size-aware geometry', () => {
    const sidebar = readStyle('sidebar.css');
    const tokens = readStyle('tokens.css');
    const popup = readPopupStyle();
    expect(sidebar).toContain('/* Sidebar primary actions.');
    expect(sidebar).toContain('.nui-btn-text');
    expect(sidebar).toContain('background: var(--mail-sidebar-action-bg) !important');
    expect(sidebar).toContain('align-items: center !important');
    expect(sidebar).toContain('justify-content: center !important');
    expect(sidebar).toContain('font-weight: 600 !important');
    expect(sidebar).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(sidebar).toContain('min-block-size: var(--mail-minimal-action-min-height) !important');
    expect(sidebar).not.toMatch(/transform:\s*scale/i);
    expect(tokens).toContain('--mail-sidebar-action-bg: #ffffff');
    expect(tokens).toContain('--mail-sidebar-action-bg: #223047');
    expect(tokens).toContain('--mail-sidebar-action-hover-bg: #eef4ff');
    expect(tokens).toContain('--mail-sidebar-action-hover-bg: #2b3a53');
    expect(tokens).toContain('--mail-minimal-action-min-height: max(40px');
    expect(tokens).toContain('--mail-minimal-action-padding-inline');
    expect(tokens).toContain('--mail-minimal-action-icon-size');
    expect(popup).toContain('--popup-surface: #202a36');
    expect(popup).toContain('.switch { display: inline-flex; align-items: center');
    expect(popup).toContain('top: 2px; left: 2px');
  });

  it('keeps message bodies untouched while styling reader controls and the marked quick-reply panel', () => {
    const css = readStyle('reader.css');
    expect(css).not.toMatch(/filter:\s*invert/i);
    expect(css).not.toMatch(/iframe\s*\{/i);
    expect(css).toContain('[data-mail-minimal-reader-quick-reply]');
    expect(css).toContain('[data-mail-minimal-reader-quick-reply-hidden]');
    expect(css).toContain('[data-mail-minimal-reader-message-surface]');
    expect(css).toContain(':hover:not(:disabled):not([aria-disabled="true"])');
    expect(css).toContain(':active:not(:disabled):not([aria-disabled="true"])');
    expect(css).toContain('.nui-btn[aria-disabled="true"]');
  });
});
