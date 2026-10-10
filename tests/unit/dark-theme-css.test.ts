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
    expect(css).toContain('--mail-sidebar: #1c2530');
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

  it('keeps dark popup controls on the restrained palette without changing sidebar geometry', () => {
    const sidebar = readStyle('sidebar.css');
    const popup = readPopupStyle();
    expect(sidebar).not.toContain('[data-mail-minimal-theme="dark"] #dvNavTop li[role="button"] {');
    expect(popup).toContain('--popup-surface: #202a36');
    expect(popup).toContain('.switch { display: inline-flex; align-items: center');
    expect(popup).toContain('top: 2px; left: 2px');
  });

  it('does not target reader iframe documents or generic message bodies', () => {
    const css = readStyle('reader.css');
    expect(css).not.toMatch(/iframe\s*\{/i);
    expect(css).not.toMatch(/filter:\s*invert/i);
  });
});
