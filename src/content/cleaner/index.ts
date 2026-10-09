import type { MailPage, Settings } from '../../shared/types';
import { cleanAdvertisements } from './advertisement-cleaner';
import { cleanAi } from './ai-cleaner';
import { clearHidden } from './dom';
import { cleanHeader } from './header-cleaner';
import { handleHomepage } from './home-cleaner';
import { cleanSidebar } from './sidebar-cleaner';

export function applyCleaner(settings: Settings, page: MailPage, documentRef: Document = document): void {
  clearHidden(documentRef);
  if (!settings.cleanerEnabled) return;
  cleanHeader(settings, documentRef);
  cleanSidebar(settings, documentRef);
  cleanAi(settings, documentRef);
  if (page === 'welcome' && settings.homepageMode !== 'original-home') cleanAdvertisements(settings, documentRef);
  handleHomepage(settings, page, documentRef);
}
