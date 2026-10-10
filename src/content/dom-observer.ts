export class BatchedObserver {
  private readonly observer: MutationObserver;
  private scheduled = false;

  constructor(private readonly callback: () => void) {
    this.observer = new MutationObserver((records) => {
      if (records.some((record) => this.isExternalChange(record))) this.schedule();
    });
  }

  observe(root: Node): void {
    this.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-selected', 'aria-hidden']
    });
  }

  schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.callback();
    });
  }

  disconnect(): void {
    this.observer.disconnect();
  }

  private isExternalChange(record: MutationRecord): boolean {
    if (record.type === 'childList') {
      return !isMinimalCardMutation(record);
    }
    const target = record.target as Element;
    if (target.closest('[data-mail-minimal-card]')) return false;
    if (!target.hasAttribute('data-mail-minimal-hidden')) return true;
    if (record.attributeName !== 'style') return false;
    const style = (target as HTMLElement).style;
    // A site redraw may replace our inline display declaration. Reconcile only
    // when that happened; ignore our own idempotent `display: none !important`.
    return style.getPropertyValue('display') !== 'none' || style.getPropertyPriority('display') !== 'important';
  }
}

function isMinimalCardMutation(record: MutationRecord): boolean {
  if (record.target instanceof Element && record.target.closest('[data-mail-minimal-card]')) return true;
  const nodes = [...record.addedNodes, ...record.removedNodes];
  return nodes.length > 0 && nodes.every((node) => node instanceof Element && (node.matches('[data-mail-minimal-card]') || node.closest('[data-mail-minimal-card]')));
}
