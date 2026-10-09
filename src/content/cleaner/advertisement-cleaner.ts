import type { Settings } from '../../shared/types';
import { setHidden, tidy } from './dom';

/** Only inspects the welcome module and only accepts a bounded card around a verified advert badge. */
export function cleanAdvertisements(settings: Settings, documentRef: Document = document): void {
  if (!settings.hideAds) return;
  const root = documentRef.querySelector('#dvContentContainer');
  if (!root) return;
  for (const badge of root.querySelectorAll('span, div, a')) {
    if (tidy(badge.textContent) !== '广告') continue;
    const card = closestBoundedCard(badge, root);
    if (card) setHidden(card, true);
  }
  root.querySelectorAll('[data-ad], [data-advertisement], .mail-advertisement').forEach((element) => setHidden(element, true));
}

function closestBoundedCard(start: Element, stop: Element): Element | undefined {
  let current: Element | null = start;
  for (let depth = 0; current && current !== stop && depth < 7; depth += 1, current = current.parentElement) {
    const rect = current.getBoundingClientRect();
    if (rect.width >= 240 && rect.width <= 1100 && rect.height >= 80 && rect.height <= 440) return current;
  }
  return undefined;
}
