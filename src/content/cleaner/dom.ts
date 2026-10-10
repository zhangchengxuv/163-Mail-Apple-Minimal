import { HIDDEN_ATTRIBUTE } from '../../shared/constants';

const ORIGINAL_DISPLAY_VALUE_ATTRIBUTE = 'data-mail-minimal-original-display';
const ORIGINAL_DISPLAY_PRIORITY_ATTRIBUTE = 'data-mail-minimal-original-display-priority';

export const tidy = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, '').trim();

export function setHidden(element: Element, hidden: boolean): void {
  if (hidden) {
    if (!element.hasAttribute(ORIGINAL_DISPLAY_VALUE_ATTRIBUTE)) {
      element.setAttribute(ORIGINAL_DISPLAY_VALUE_ATTRIBUTE, (element as HTMLElement).style.getPropertyValue('display'));
      element.setAttribute(ORIGINAL_DISPLAY_PRIORITY_ATTRIBUTE, (element as HTMLElement).style.getPropertyPriority('display'));
    }
    if (element.getAttribute(HIDDEN_ATTRIBUTE) !== 'true') element.setAttribute(HIDDEN_ATTRIBUTE, 'true');
    const style = (element as HTMLElement).style;
    if (style.getPropertyValue('display') !== 'none' || style.getPropertyPriority('display') !== 'important') {
      style.setProperty('display', 'none', 'important');
    }
    return;
  }

  if (!element.hasAttribute(HIDDEN_ATTRIBUTE)) return;
  const style = (element as HTMLElement).style;
  const originalValue = element.getAttribute(ORIGINAL_DISPLAY_VALUE_ATTRIBUTE);
  const originalPriority = element.getAttribute(ORIGINAL_DISPLAY_PRIORITY_ATTRIBUTE);
  if (originalValue) style.setProperty('display', originalValue, originalPriority ?? '');
  else style.removeProperty('display');
  element.removeAttribute(HIDDEN_ATTRIBUTE);
  element.removeAttribute(ORIGINAL_DISPLAY_VALUE_ATTRIBUTE);
  element.removeAttribute(ORIGINAL_DISPLAY_PRIORITY_ATTRIBUTE);
}

export function clearHidden(documentRef: Document = document): void {
  documentRef.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`).forEach((element) => setHidden(element, false));
}

export function hideExactLabels(scope: ParentNode, labels: ReadonlySet<string>): void {
  for (const element of scope.querySelectorAll('a, button, li, [role="button"], [role="tab"]')) {
    if (!labels.has(tidy(element.textContent))) continue;
    const nestedMatch = [...element.children].some((child) => labels.has(tidy(child.textContent)));
    if (!nestedMatch) setHidden(element, true);
  }
}
