import { PAGE_ATTRIBUTE, THEME_ATTRIBUTE } from '../../shared/constants';
import { accentValue } from '../../shared/settings';
import type { MailPage, Settings } from '../../shared/types';
import { resolvedThemeForSettings, type ResolvedThemeMode } from '../../shared/theme-mode';

const pageEnabled = (page: MailPage, settings: Settings): boolean => {
  if (!settings.themeEnabled) return false;
  if (page === 'compose') return settings.themeCompose;
  if (page === 'read') return settings.themeRead;
  if (page === 'list' || page === 'welcome') return settings.themeList || settings.themeSidebar || settings.themeHeader;
  return false;
};

export function applyTheme(
  settings: Settings,
  page: MailPage,
  root: HTMLElement = document.documentElement,
  resolvedTheme = resolvedThemeForSettings(settings)
): ResolvedThemeMode | undefined {
  root.setAttribute(PAGE_ATTRIBUTE, page);
  root.style.setProperty('--mail-minimal-accent', accentValue(settings));
  const enabled = pageEnabled(page, settings);
  if (enabled) {
    root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
    root.setAttribute('data-mail-minimal-theme-mode', settings.themeMode);
  } else {
    root.removeAttribute(THEME_ATTRIBUTE);
    root.removeAttribute('data-mail-minimal-theme-mode');
  }
  root.toggleAttribute('data-mail-minimal-header', settings.themeEnabled && settings.themeHeader);
  root.toggleAttribute('data-mail-minimal-sidebar', settings.themeEnabled && settings.themeSidebar);
  root.toggleAttribute('data-mail-minimal-list', settings.themeEnabled && settings.themeList && page === 'list');
  return enabled ? resolvedTheme : undefined;
}
