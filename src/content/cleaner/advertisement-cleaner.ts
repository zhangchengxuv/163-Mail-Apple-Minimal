import type { Settings } from '../../shared/types';
import { setHidden, tidy } from './dom';

/** Only inspects the welcome module and only accepts a bounded card around a verified advert badge. */
export function cleanAdvertisements(settings: Settings, documentRef: Document = document): void {
  const root = welcomeRoot(documentRef);
  if (!root) return;
  if (settings.hideAds) {
    for (const badge of root.querySelectorAll('span, div, a')) {
      if (tidy(badge.textContent) !== '广告') continue;
      const card = closestBoundedCard(badge, root);
      if (card) setHidden(card, true);
    }
    root.querySelectorAll('[data-ad], [data-advertisement], .mail-advertisement').forEach((element) => setHidden(element, true));
  }
  if (settings.hideAi) cleanWelcomeAiModules(root);
}

function welcomeRoot(documentRef: Document): Element | null {
  return documentRef.querySelector('[id*="welcome.WelcomeModule" i], [id*="WelcomeModule" i], #dvContentContainer');
}

function cleanWelcomeAiModules(root: Element): void {
  const moduleSelectors = [
    '[data-module*="assistant" i]', '[data-component*="assistant" i]',
    '[data-testid*="assistant" i]', '[data-module*="ai" i]',
    '.APP-smartAssistant', '.APP-toolAssistant', '.APP-jobAssistant'
  ];
  root.querySelectorAll(moduleSelectors.join(', ')).forEach((element) => setHidden(element, true));

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
