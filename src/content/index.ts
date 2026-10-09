import { applyCleaner } from './cleaner';
import { BatchedObserver } from './dom-observer';
import { detectPage } from './page-detector';
import { applyTheme } from './theme';
import { getSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

let settings: Settings;
let currentPage = detectPage();
let initialized = false;

function refresh(): void {
  currentPage = detectPage();
  applyTheme(settings, currentPage);
  applyCleaner(settings, currentPage);
  initialized = true;
}

async function start(): Promise<void> {
  settings = await getSettings();
  refresh();
  const observer = new BatchedObserver(refresh);
  observer.observe(document.documentElement);
  window.addEventListener('popstate', () => observer.schedule());
  window.addEventListener('hashchange', () => observer.schedule());
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.settings) return;
    settings = changes.settings.newValue as Settings;
    refresh();
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'mail-minimal:status') return;
    sendResponse({ ready: initialized, page: currentPage });
  });
}

void start();
