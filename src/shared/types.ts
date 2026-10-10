import type { WeatherLocationMode } from './weather-types';

export type MailPage = 'welcome' | 'list' | 'compose' | 'read' | 'unknown';
export type HomepageMode = 'inbox' | 'minimal-home' | 'original-home';
export type AccentColor = 'blue' | 'graphite' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';
export type UiFontSize = 13 | 14 | 15 | 16;

export interface Settings {
  cleanerEnabled: boolean;
  hideAds: boolean;
  hideAi: boolean;
  hideMembership: boolean;
  hideOtherTools: boolean;
  hideEnterprisePromotion: boolean;
  themeEnabled: boolean;
  themeHeader: boolean;
  themeSidebar: boolean;
  themeList: boolean;
  themeCompose: boolean;
  themeRead: boolean;
  themeMode: ThemeMode;
  uiFontSize: UiFontSize;
  homepageMode: HomepageMode;
  accentColor: AccentColor;
  customAccent: string;
  showWeather: boolean;
  weatherLocationMode: WeatherLocationMode;
  weatherCity: string;
}
