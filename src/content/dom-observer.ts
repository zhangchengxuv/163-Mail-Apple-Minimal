export class BatchedObserver {
  private readonly observer: MutationObserver;
  private scheduled = false;

  constructor(private readonly callback: () => void) {
    this.observer = new MutationObserver(() => this.schedule());
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
}
