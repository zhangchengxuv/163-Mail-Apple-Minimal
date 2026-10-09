import './theme/styles/tokens.css';
import './theme/styles/common.css';
import './theme/styles/header.css';
import './theme/styles/sidebar.css';
import './theme/styles/mail-list.css';
import './theme/styles/compose.css';
import './theme/styles/reader.css';
import './theme/styles/welcome.css';
import './theme/styles/responsive.css';
import { applyCleaner } from './cleaner';
import { BatchedObserver } from './dom-observer';
import { detectPage } from './page-detector';
import { applyTheme } from './theme';
import { getSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

let settings: Settings;
let currentPage = detectPage();

function refresh(): void {
  currentPage = detectPage();
  applyTheme(settings, currentPage);
  applyCleaner(settings, currentPage);
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
}

void start();
