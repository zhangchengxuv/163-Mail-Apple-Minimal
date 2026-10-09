import { PAGE_ATTRIBUTE, THEME_ATTRIBUTE } from '../../shared/constants';
import { accentValue } from '../../shared/settings';
import type { MailPage, Settings } from '../../shared/types';

const pageEnabled = (page: MailPage, settings: Settings): boolean => {
  if (!settings.themeEnabled) return false;
  if (page === 'compose') return settings.themeCompose;
  if (page === 'read') return settings.themeRead;
  if (page === 'list' || page === 'welcome') return settings.themeList || settings.themeSidebar || settings.themeHeader;
  return false;
};

export function applyTheme(settings: Settings, page: MailPage, root: HTMLElement = document.documentElement): void {
  root.setAttribute(PAGE_ATTRIBUTE, page);
  root.style.setProperty('--mail-minimal-accent', accentValue(settings));
  root.toggleAttribute(THEME_ATTRIBUTE, pageEnabled(page, settings));
  root.toggleAttribute('data-mail-minimal-header', settings.themeEnabled && settings.themeHeader);
  root.toggleAttribute('data-mail-minimal-sidebar', settings.themeEnabled && settings.themeSidebar);
  root.toggleAttribute('data-mail-minimal-list', settings.themeEnabled && settings.themeList);
}
