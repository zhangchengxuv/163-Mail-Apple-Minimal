import './popup.css';
import { VERSION } from '../shared/constants';
import { getSettings, resetSettings, updateSettings } from '../shared/settings';
import { applyExtensionTheme } from '../shared/extension-theme';
import type { MailPage, Settings } from '../shared/types';

const status = document.querySelector<HTMLElement>('#site-status')!;
const icon = document.querySelector<HTMLImageElement>('#brand-icon')!;
const cleaner = document.querySelector<HTMLInputElement>('[data-setting="cleanerEnabled"]')!;
const theme = document.querySelector<HTMLInputElement>('[data-setting="themeEnabled"]')!;
const homepage = [...document.querySelectorAll<HTMLInputElement>('input[name="homepageMode"]')];
const themeMode = [...document.querySelectorAll<HTMLInputElement>('input[name="themeMode"]')];
let activeSettings: Settings;

function setStatus(text: string, kind: 'ready' | 'waiting' | 'unsupported'): void {
  status.textContent = text;
  status.dataset.kind = kind;
}

function render(settings: Settings): void {
  activeSettings = settings;
  applyExtensionTheme(settings);
  cleaner.checked = settings.cleanerEnabled;
  theme.checked = settings.themeEnabled;
  homepage.forEach((input) => { input.checked = input.value === settings.homepageMode; });
  themeMode.forEach((input) => { input.checked = input.value === settings.themeMode; });
}

function pageName(page: MailPage): string {
  return ({ welcome: '首页', list: '邮件列表', compose: '写信', read: '读信', unknown: '邮箱页面' })[page];
}

async function refreshStatus(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return setStatus('未找到当前浏览器标签页', 'unsupported');
  if (tab.url && !tab.url.startsWith('https://mail.163.com/')) return setStatus('当前页面不受支持', 'unsupported');
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'mail-minimal:status' }) as { ready: boolean; page: MailPage };
    setStatus(result.ready ? `已连接 · ${pageName(result.page)}` : '网易邮箱正在加载…', result.ready ? 'ready' : 'waiting');
  } catch {
    setStatus('已识别网易邮箱，正在等待页面注入…', 'waiting');
  }
}

async function init(): Promise<void> {
  icon.src = chrome.runtime.getURL('icons/icon48.png');
  document.querySelector('#version')!.textContent = `v${VERSION}`;
  render(await getSettings());
  await refreshStatus();
  cleaner.addEventListener('change', async () => render(await updateSettings({ cleanerEnabled: cleaner.checked })));
  theme.addEventListener('change', async () => render(await updateSettings({ themeEnabled: theme.checked })));
  themeMode.forEach((input) => input.addEventListener('change', async () => {
    if (input.checked) render(await updateSettings({ themeMode: input.value as Settings['themeMode'] }));
  }));
  homepage.forEach((input) => input.addEventListener('change', async () => {
    if (input.checked) render(await updateSettings({ homepageMode: input.value as Settings['homepageMode'] }));
  }));
  document.querySelector('#reset')!.addEventListener('click', async () => render(await resetSettings()));
  document.querySelector('#advanced')!.addEventListener('click', () => void chrome.runtime.openOptionsPage());
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (activeSettings?.themeMode === 'system') applyExtensionTheme(activeSettings);
  });
}

void init();
