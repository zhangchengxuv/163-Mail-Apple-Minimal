import { HIDDEN_ATTRIBUTE } from '../../shared/constants';

export const tidy = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, '').trim();

export function setHidden(element: Element, hidden: boolean): void {
  if (hidden) element.setAttribute(HIDDEN_ATTRIBUTE, 'true');
  else element.removeAttribute(HIDDEN_ATTRIBUTE);
}

export function clearHidden(documentRef: Document = document): void {
  documentRef.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`).forEach((element) => element.removeAttribute(HIDDEN_ATTRIBUTE));
}

export function hideExactLabels(scope: ParentNode, labels: ReadonlySet<string>): void {
  for (const element of scope.querySelectorAll('a, button, li, [role="button"], [role="tab"]')) {
    if (!labels.has(tidy(element.textContent))) continue;
    const nestedMatch = [...element.children].some((child) => labels.has(tidy(child.textContent)));
    if (!nestedMatch) setHidden(element, true);
  }
}
