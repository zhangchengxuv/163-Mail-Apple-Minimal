import type { Settings } from '../../shared/types';
import { setHidden } from './dom';

const STABLE_AI_SELECTORS = [
  '#APP-smartAssistant',
  '.APP-smartAssistant',
  '.APP-smartAssistant-operating',
  '.APP-smartAssistant-btn',
  '.APP-smartAssistant-reminder',
  '.APP-smartAssistant-container',
  '.nui-ico-letterai',
  '[id$="_dvReadSAGuide"]',
  '[id$="_dvReadYad"]'
];

export function cleanAi(settings: Settings, documentRef: Document = document): void {
  if (!settings.hideAi) return;
  for (const selector of STABLE_AI_SELECTORS) {
    documentRef.querySelectorAll(selector).forEach((element) => setHidden(element, true));
  }
  // The search icon is a distinct AI affordance; retain the adjacent normal mail search control.
  documentRef.querySelectorAll('.top-search-ai-ico').forEach((icon) => {
    const trigger = icon.closest('a, button, [role="button"]');
    if (trigger) setHidden(trigger, true);
  });
}
