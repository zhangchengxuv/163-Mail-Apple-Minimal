import './popup.css';
import { VERSION } from '../shared/constants';
import { getSettings, resetSettings, updateSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#settings-form');
const reset = document.querySelector<HTMLButtonElement>('#reset');
const status = document.querySelector<HTMLElement>('#site-status');

const cleanerFields: Array<[keyof Settings, string]> = [
  ['cleanerEnabled', '启用界面净化'], ['hideAds', '隐藏广告'], ['hideAi', '隐藏 AI 相关入口'],
  ['hideMembership', '隐藏会员推广'], ['hideOtherTools', '隐藏其他工具'], ['hideEnterprisePromotion', '隐藏企业邮箱推广']
];
const themeFields: Array<[keyof Settings, string]> = [
  ['themeEnabled', '启用 Apple Mail 主题'], ['themeHeader', '美化顶部导航'], ['themeSidebar', '美化左侧导航'],
  ['themeList', '美化邮件列表'], ['themeCompose', '美化写信页面'], ['themeRead', '美化阅读页面']
];

function checkbox(key: keyof Settings, label: string, checked: boolean, disabled = false): string {
  return `<label class="setting"><span>${label}</span><input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}></label>`;
}

function render(settings: Settings): void {
  if (!form) return;
  form.innerHTML = `
    <section class="group"><h2>界面净化</h2><p class="group-description">仅隐藏已验证的推广和工具入口。</p>${cleanerFields.map(([key, text], index) => checkbox(key, text, Boolean(settings[key]), index > 0 && !settings.cleanerEnabled)).join('')}</section>
    <section class="group"><h2>外观设置</h2>${themeFields.map(([key, text], index) => checkbox(key, text, Boolean(settings[key]), index > 0 && !settings.themeEnabled)).join('')}</section>
    <section class="group"><h2>首页行为</h2><div class="radios">
      <label><input type="radio" name="homepageMode" value="inbox" ${settings.homepageMode === 'inbox' ? 'checked' : ''}>默认打开收件箱</label>
      <label><input type="radio" name="homepageMode" value="minimal-home" ${settings.homepageMode === 'minimal-home' ? 'checked' : ''}>保留极简首页</label>
      <label><input type="radio" name="homepageMode" value="original-home" ${settings.homepageMode === 'original-home' ? 'checked' : ''}>保留原版首页</label>
    </div></section>
    <section class="group"><h2>主题配色</h2><div class="accent-row"><select data-setting="accentColor"><option value="blue">系统蓝</option><option value="graphite">石墨灰</option><option value="custom">自定义强调色</option></select><input aria-label="自定义强调色" type="color" data-setting="customAccent" value="${settings.customAccent}"></div></section>`;
  const accent = form.querySelector<HTMLSelectElement>('[data-setting="accentColor"]');
  if (accent) accent.value = settings.accentColor;
}

async function refreshStatus(): Promise<void> {
  const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (status) status.textContent = tab?.url?.startsWith('https://mail.163.com/') ? '已适配当前 163 邮箱页面' : '请在 mail.163.com 页面使用';
}

async function init(): Promise<void> {
  render(await getSettings());
  await refreshStatus();
  if (form) form.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const key = target.dataset.setting as keyof Settings | undefined;
    if (!key) {
      if (target.name === 'homepageMode') render(await updateSettings({ homepageMode: target.value as Settings['homepageMode'] }));
      return;
    }
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    render(await updateSettings({ [key]: value } as Partial<Settings>));
  });
  reset?.addEventListener('click', async () => render(await resetSettings()));
}

void init();
document.querySelector('footer span')!.textContent = `v${VERSION}`;
