/**
 * Verified, welcome-page-only DOM anchors from a locally saved 163 Mail JS6 page.
 * The numeric prefix changes per session; the suffixes identify the rendered module.
 */
export const WELCOME_ROOT_SELECTOR = [
  '[id^="_dvModuleContainer_welcome.WelcomeModule_"]',
  '[id*="welcome.WelcomeModule" i]'
].join(', ');

export const WELCOME_INNER_SELECTOR = '[id$="_dvInner"]';
export const WELCOME_AD_PANEL_SELECTOR = '[id$="_dvmailrecompanel"]';
export const WELCOME_AD_PLACEHOLDER_SELECTOR = '[id$="_dvheightplaceholder"]';
export const WELCOME_ASSISTANT_PANEL_SELECTOR = '[id$="_dvAssistantPanel"]';
export const WELCOME_INFO_PANEL_SELECTOR = '[id$="_dvInfoPanel"]';
export const WELCOME_PAYMENT_SELECTOR = '[id$="_dvPayment"]';
export const WELCOME_PRIVILEGES_PANEL_SELECTOR = '[id$="_dvPrivilegesPanel"]';

export function findWelcomeRoot(documentRef: Document = document): HTMLElement | null {
  return documentRef.querySelector<HTMLElement>(WELCOME_ROOT_SELECTOR);
}

export function findWelcomeInner(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(WELCOME_INNER_SELECTOR);
}
