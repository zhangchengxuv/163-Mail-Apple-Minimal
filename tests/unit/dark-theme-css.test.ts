import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readStyle = (name: string): string => readFileSync(new URL(`../../src/content/theme/styles/${name}`, import.meta.url), 'utf8');

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
  });

  it('does not target reader iframe documents or generic message bodies', () => {
    const css = readStyle('reader.css');
    expect(css).not.toMatch(/iframe\s*\{/i);
    expect(css).not.toMatch(/filter:\s*invert/i);
  });
});
