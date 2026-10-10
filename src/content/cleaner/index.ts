import type { MailPage, Settings } from '../../shared/types';
import { cleanAdvertisements } from './advertisement-cleaner';
import { cleanAi } from './ai-cleaner';
import { clearHidden } from './dom';
import { cleanHeader } from './header-cleaner';
import { handleHomepage } from './home-cleaner';
import { syncTodayCard } from './home-card';
import { cleanSidebar } from './sidebar-cleaner';

const lastCleanerState = new WeakMap<Document, string>();

export function applyCleaner(settings: Settings, page: MailPage, documentRef: Document = document): void {
  const minimalWelcome = settings.cleanerEnabled && page === 'welcome' && settings.homepageMode === 'minimal-home';
  const root = documentRef.documentElement;
  root.toggleAttribute('data-mail-minimal-cleaner', settings.cleanerEnabled);
  root.toggleAttribute('data-mail-minimal-hide-other-tools', settings.cleanerEnabled && settings.hideOtherTools);
  root.toggleAttribute('data-mail-minimal-hide-ai', settings.cleanerEnabled && (settings.hideAi || minimalWelcome));
  root.toggleAttribute('data-mail-minimal-hide-ads', settings.cleanerEnabled && (settings.hideAds || minimalWelcome) && page === 'welcome' && settings.homepageMode !== 'original-home');
  root.toggleAttribute('data-mail-minimal-hide-membership', settings.cleanerEnabled && settings.hideMembership);
  root.toggleAttribute('data-mail-minimal-hide-welcome-membership', settings.cleanerEnabled && settings.hideMembership && page === 'welcome' && settings.homepageMode !== 'original-home');
  root.toggleAttribute('data-mail-minimal-hide-enterprise', settings.cleanerEnabled && settings.hideEnterprisePromotion);
  const state = JSON.stringify({
    page,
    cleanerEnabled: settings.cleanerEnabled,
    hideAds: settings.hideAds,
    hideAi: settings.hideAi,
    hideMembership: settings.hideMembership,
    hideOtherTools: settings.hideOtherTools,
    hideEnterprisePromotion: settings.hideEnterprisePromotion,
    homepageMode: settings.homepageMode
  });
  if (lastCleanerState.get(documentRef) !== state) {
    clearHidden(documentRef);
    lastCleanerState.set(documentRef, state);
  }
  if (!settings.cleanerEnabled) {
    syncTodayCard(settings, page, documentRef);
    return;
  }
  cleanHeader(settings, documentRef);
  cleanSidebar(settings, documentRef);
  cleanAi(settings, documentRef);
  if (page === 'welcome' && settings.homepageMode !== 'original-home') {
    cleanAdvertisements({ ...settings, hideAds: settings.hideAds || minimalWelcome, hideAi: settings.hideAi || minimalWelcome }, documentRef);
  }
  handleHomepage(settings, page, documentRef);
  syncTodayCard(settings, page, documentRef);
}
