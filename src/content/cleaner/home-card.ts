import type { Settings } from '../../shared/types';
import { findWelcomeInner, findWelcomeRoot, WELCOME_INFO_PANEL_SELECTOR } from './welcome-dom';

const CARD_ATTRIBUTE = 'data-mail-minimal-card';

export function syncTodayCard(settings: Settings, page: string, documentRef: Document = document): void {
  const existing = documentRef.querySelector<HTMLElement>(`[${CARD_ATTRIBUTE}="today"]`);
  const enabled = settings.cleanerEnabled && settings.themeEnabled && settings.homepageMode === 'minimal-home' && page === 'welcome';
  if (!enabled) {
    existing?.remove();
    return;
  }

  const placement = welcomePlacement(documentRef);
  if (!placement) return;
  const card = existing ?? createCard(documentRef);
  placeCard(card, placement);
  updateCard(card, documentRef);
}

function welcomePlacement(documentRef: Document): { inner: HTMLElement; anchor: Element | null } | null {
  const root = findWelcomeRoot(documentRef);
  if (!root) return null;
  const inner = findWelcomeInner(root);
  if (!inner) return null;
  const infoPanel = inner.querySelector<HTMLElement>(WELCOME_INFO_PANEL_SELECTOR);
  return { inner, anchor: infoPanel?.parentElement ?? null };
}

function placeCard(card: HTMLElement, placement: { inner: HTMLElement; anchor: Element | null }): void {
  const { inner, anchor } = placement;
  if (anchor) {
    if (card.parentElement !== inner || card.previousElementSibling !== anchor) anchor.after(card);
    return;
  }
  if (card.parentElement !== inner) inner.append(card);
}

function createCard(documentRef: Document): HTMLElement {
  const card = documentRef.createElement('section');
  card.setAttribute(CARD_ATTRIBUTE, 'today');
  card.setAttribute('aria-label', '今日概览');
  card.innerHTML = `<div class="mail-minimal-today-heading"><div><p>Today</p><h2>今日概览</h2></div><time></time></div><div class="mail-minimal-today-stats"><span data-stat="unread"><b>—</b>未读邮件</span><span data-stat="drafts"><b>—</b>草稿</span></div><div class="mail-minimal-today-actions"><button type="button" data-action="inbox">打开收件箱</button><button type="button" data-action="compose">写邮件</button></div>`;
  card.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'inbox') clickNative(documentRef, '收件箱');
    if (button.dataset.action === 'compose') clickNative(documentRef, '写信');
  });
  return card;
}

function updateCard(card: HTMLElement, documentRef: Document): void {
  const now = new Date();
  const time = card.querySelector('time');
  if (time) time.textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(now);
  setStat(card, 'unread', countFolder(documentRef, '收件箱'));
  setStat(card, 'drafts', countFolder(documentRef, '草稿箱'));
}

function setStat(card: HTMLElement, name: string, count: number | undefined): void {
  const target = card.querySelector<HTMLElement>(`[data-stat="${name}"] b`);
  if (target) target.textContent = count === undefined ? '—' : String(count);
}

function countFolder(documentRef: Document, name: string): number | undefined {
  const labels = documentRef.querySelectorAll('#dvNavTree .nui-tree-item-label, #dvNavContainer [role="treeitem"]');
  for (const label of labels) {
    const title = label.querySelector('[title]')?.getAttribute('title') ?? '';
    if (title !== name && !label.textContent?.replace(/\s/g, '').startsWith(name)) continue;
    const count = label.textContent?.match(/\((\d+)\)/)?.[1];
    return count ? Number(count) : 0;
  }
  return undefined;
}

function clickNative(documentRef: Document, label: string): void {
  const scope = documentRef.querySelector('#dvNavContainer') ?? documentRef;
  const target = [...scope.querySelectorAll<HTMLElement>('[role="button"], a, .nui-tree-item-label')]
    .find((element) => element.textContent?.replace(/\s/g, '') === label || element.querySelector(`[title="${label}"]`));
  target?.click();
}
