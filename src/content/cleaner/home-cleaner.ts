import type { Settings } from '../../shared/types';

let redirected = false;

export function handleHomepage(settings: Settings, page: string, documentRef: Document = document): void {
  if (settings.homepageMode !== 'inbox' || page !== 'welcome' || redirected) return;
  const inbox = [...documentRef.querySelectorAll('#dvNavContainer [role="button"], #dvNavContainer a')]
    .find((element) => element.textContent?.replace(/\s/g, '') === '收件箱') as HTMLElement | undefined;
  if (inbox) {
    redirected = true;
    inbox.click();
  }
}
