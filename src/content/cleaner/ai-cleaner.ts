import type { Settings } from '../../shared/types';
import { setHidden } from './dom';

const STABLE_AI_SELECTORS = [
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
}
