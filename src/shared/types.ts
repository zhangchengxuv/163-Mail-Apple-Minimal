export type MailPage = 'welcome' | 'list' | 'compose' | 'read' | 'unknown';
export type HomepageMode = 'inbox' | 'minimal-home' | 'original-home';
export type AccentColor = 'blue' | 'graphite' | 'custom';

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
  homepageMode: HomepageMode;
  accentColor: AccentColor;
  customAccent: string;
  showWeather: boolean;
  weatherCity: string;
}
