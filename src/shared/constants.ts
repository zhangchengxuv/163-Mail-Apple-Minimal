import type { Settings } from './types';

export const STORAGE_KEY = 'settings';
export const PAGE_ATTRIBUTE = 'data-mail-minimal-page';
export const THEME_ATTRIBUTE = 'data-mail-minimal-theme';
export const HIDDEN_ATTRIBUTE = 'data-mail-minimal-hidden';
export const VERSION = '1.3.0';

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  cleanerEnabled: true,
  hideAds: true,
  hideAi: true,
  hideMembership: true,
  hideOtherTools: true,
  hideEnterprisePromotion: true,
  themeEnabled: true,
  themeHeader: true,
  themeSidebar: true,
  themeList: true,
  themeCompose: true,
  themeRead: true,
  themeMode: 'system',
  uiFontSize: 14,
  homepageMode: 'inbox',
  accentColor: 'blue',
  customAccent: '#007AFF',
  showWeather: true,
  weatherLocationMode: 'manual',
  weatherCity: 'Tokyo'
});

export const ACCENTS = {
  blue: '#007AFF',
  graphite: '#596273'
} as const;
