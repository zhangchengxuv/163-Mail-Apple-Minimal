import type { Settings } from '../../shared/types';
import { setHidden, tidy } from './dom';
import {
  findWelcomeRoot,
  WELCOME_AD_PANEL_SELECTOR,
  WELCOME_AD_PLACEHOLDER_SELECTOR,
  WELCOME_ASSISTANT_PANEL_SELECTOR,
  WELCOME_PAYMENT_SELECTOR,
  WELCOME_PRIVILEGES_PANEL_SELECTOR
} from './welcome-dom';

/** Only inspects the welcome module and only accepts a bounded card around a verified advert badge. */
export function cleanAdvertisements(settings: Settings, documentRef: Document = document): void {
  const root = findWelcomeRoot(documentRef);
  if (!root) return;
  if (settings.hideAds) {
    // JS6 creates the recommendation banner with createId('dvmailrecompanel').
    // Its “广告” badge is image-based and intentionally has no text, so hiding the
    // verified module root (and its measured placeholder) is safer than text matching.
    root.querySelectorAll(`${WELCOME_AD_PANEL_SELECTOR}, ${WELCOME_AD_PLACEHOLDER_SELECTOR}`)
      .forEach((element) => setHidden(element, true));
    for (const badge of root.querySelectorAll('span, div, a')) {
      if (!isAdBadge(badge)) continue;
      const card = closestBoundedCard(badge, root);
      if (card) setHidden(card, true);
    }
    root.querySelectorAll('[data-ad], [data-advertisement], .mail-advertisement').forEach((element) => setHidden(element, true));
  }
  if (settings.hideAi) cleanWelcomeAiModules(root);
  if (settings.hideMembership) {
    // Keep the account summary intact; only hide the nested paid-membership CTA.
    root.querySelectorAll(`${WELCOME_PAYMENT_SELECTOR}, ${WELCOME_PRIVILEGES_PANEL_SELECTOR}`)
      .forEach((element) => setHidden(element, true));
  }
}

function isAdBadge(element: Element): boolean {
  const label = tidy(element.textContent);
  // NetEase currently renders this as “广告▼”; earlier variants used “广告×”.
  if (!label.startsWith('广告')) return false;
  const rect = element.getBoundingClientRect();
  return rect.width <= 100 && rect.height <= 48;
}

function cleanWelcomeAiModules(root: Element): void {
  const moduleSelectors = [
    '[data-module*="assistant" i]', '[data-component*="assistant" i]',
    '[data-testid*="assistant" i]', '[data-module*="ai" i]',
    '.APP-smartAssistant', '.APP-toolAssistant', '.APP-jobAssistant'
  ];
  root.querySelectorAll(`${WELCOME_ASSISTANT_PANEL_SELECTOR}, ${moduleSelectors.join(', ')}`)
    .forEach((element) => setHidden(element, true));

  // On the welcome module only, an AI assistant's large prompt card has a search-like input.
  // This bounded structural check never touches the header search or mail rows.
  for (const input of root.querySelectorAll('input[placeholder*="搜索邮件"], textarea[placeholder*="搜索邮件"]')) {
    const card = closestBoundedCard(input, root);
    if (card) setHidden(card, true);
  }
}

function closestBoundedCard(start: Element, stop: Element): Element | undefined {
  let current: Element | null = start;
  for (let depth = 0; current && current !== stop && depth < 7; depth += 1, current = current.parentElement) {
    const rect = current.getBoundingClientRect();
    if (rect.width >= 240 && rect.width <= 1100 && rect.height >= 80 && rect.height <= 440) return current;
  }
  return undefined;
}
