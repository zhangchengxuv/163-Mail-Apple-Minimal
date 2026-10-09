import type { MailPage } from '../shared/types';

const visible = (element: Element): boolean => {
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

export function detectPage(documentRef: Document = document, href = location.href): MailPage {
  if (/compose(?:%2e|\.)ComposeModule/i.test(href) || hasVisibleComposeRoot(documentRef)) return 'compose';
  if (/welcome(?:%2e|\.)WelcomeModule/i.test(href)) return 'welcome';
  if (/read(?:%2e|\.)ReadModule/i.test(href) || documentRef.querySelector('[id*="ReadModule"]')) return 'read';

  const selectedTab = documentRef.querySelector(
    '#dvMultiTabWrapper li[role="tab"].nui-tabs-item-selected .nui-tabs-item-text'
  );
  if (selectedTab?.textContent?.replace(/\s/g, '') === '首页') return 'welcome';
  if (documentRef.querySelector('#dvNavContainer.frame-nav, #dvContentContainer.frame-main-outer')) return 'list';
  return 'unknown';
}

function hasVisibleComposeRoot(documentRef: Document): boolean {
  return [...documentRef.querySelectorAll('[id*="compose.ComposeModule"], [id*="ComposeModule"]')]
    .some(visible);
}
