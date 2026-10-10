import type { MailPage } from '../../shared/types';

const QUICK_REPLY_ATTRIBUTE = 'data-mail-minimal-reader-quick-reply';
const READER_ROOT_SELECTOR = '[id*="read.ReadModule" i], [id*="ReadModule"]';
const QUICK_REPLY_PATTERN = /快捷回复|quick\s*reply/i;

function isLightBackground(element: HTMLElement): boolean {
  const color = element.ownerDocument.defaultView?.getComputedStyle(element).backgroundColor ?? '';
  const values = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
  return values !== undefined && values.length === 3 && values.every((value) => value >= 190);
}

function isNearReaderBottom(candidate: HTMLElement, root: HTMLElement): boolean {
  const candidateBox = candidate.getBoundingClientRect();
  const rootBox = root.getBoundingClientRect();
  if (candidateBox.height === 0 || rootBox.height === 0) return true;
  return candidateBox.bottom >= rootBox.bottom - Math.min(240, rootBox.height / 2);
}

function findQuickReplySurface(root: HTMLElement): HTMLElement | null {
  const candidates = [...root.querySelectorAll<HTMLElement>('div, section, footer, aside, [role="region"]')]
    .filter((candidate) => QUICK_REPLY_PATTERN.test(candidate.textContent?.replace(/\s/g, '') ?? ''))
    .filter((candidate) => isNearReaderBottom(candidate, root))
    .sort((first, second) => (first.textContent?.length ?? 0) - (second.textContent?.length ?? 0));

  for (const candidate of candidates) {
    for (let surface: HTMLElement | null = candidate; surface && surface !== root; surface = surface.parentElement) {
      if (isLightBackground(surface)) return surface;
    }
  }
  return null;
}

export function syncReaderChrome(documentRef: Document = document, page: MailPage, isDark: boolean): void {
  if (page !== 'read' || !isDark) {
    documentRef.querySelectorAll(`[${QUICK_REPLY_ATTRIBUTE}]`).forEach((element) => element.removeAttribute(QUICK_REPLY_ATTRIBUTE));
    return;
  }

  documentRef.querySelectorAll<HTMLElement>(READER_ROOT_SELECTOR).forEach((root) => {
    if (root.querySelector(`[${QUICK_REPLY_ATTRIBUTE}]`)) return;
    findQuickReplySurface(root)?.setAttribute(QUICK_REPLY_ATTRIBUTE, '');
  });
}
