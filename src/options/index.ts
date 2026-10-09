import './options.css';
import { VERSION } from '../shared/constants';
import { getSettings, resetSettings, updateSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#settings-form')!;
const cleanup: Array<[keyof Settings, string, string]> = [
  ['cleanerEnabled', '启用界面净化', '关闭后会恢复扩展隐藏的原生入口'], ['hideAds', '隐藏广告与推广', '只处理欢迎页内已验证的广告容器'],
  ['hideAi', '隐藏 AI 入口', '不检查邮件主题或邮件正文'], ['hideMembership', '隐藏会员推广', '保留账户和必要设置入口'],
  ['hideOtherTools', '隐藏其他工具', '优先隐藏 #dvNavFoot 整个分组'], ['hideEnterprisePromotion', '隐藏企业邮箱推广', '不会隐藏真实邮箱账户']
];
const appearance: Array<[keyof Settings, string, string]> = [
  ['themeEnabled', '启用 Apple Mail 风格', '仅改变网易邮箱外围界面'], ['themeHeader', '顶部导航', '搜索和账户操作保持原生'],
  ['themeSidebar', '左侧导航', '不改变侧栏主内容区几何'], ['themeList', '邮件列表', '保留虚拟列表和批量操作'],
  ['themeCompose', '写信页面', '不覆盖联系人侧栏显示逻辑'], ['themeRead', '阅读页面', '不修改邮件正文或 iframe']
];

function toggle(key: keyof Settings, title: string, help: string, checked: boolean, disabled = false): string {
  return `<label class="row"><span>${title}<small>${help}</small></span><input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}></label>`;
}

function render(settings: Settings): void {
  form.innerHTML = `<section class="group"><h2>界面净化</h2><p class="description">范围限定在邮箱 UI，不扫描邮件内容。</p>${cleanup.map(([key, title, help], index) => toggle(key, title, help, Boolean(settings[key]), index > 0 && !settings.cleanerEnabled)).join('')}</section>
  <section class="group"><h2>Apple Mail 外观</h2><p class="description">各页面按独立作用域应用主题。</p>${appearance.map(([key, title, help], index) => toggle(key, title, help, Boolean(settings[key]), index > 0 && !settings.themeEnabled)).join('')}</section>
  <section class="group"><h2>首页与配色</h2><label class="row"><span>首页行为<small>默认安全地通过原生入口进入收件箱</small></span><select data-setting="homepageMode"><option value="inbox">直接进入收件箱</option><option value="minimal-home">极简首页</option><option value="original-home">网易原版首页</option></select></label><label class="row"><span>强调色</span><select data-setting="accentColor"><option value="blue">系统蓝</option><option value="graphite">石墨灰</option><option value="custom">自定义颜色</option></select></label><label class="row"><span>自定义强调色</span><input aria-label="自定义强调色" type="color" data-setting="customAccent" value="${settings.customAccent}"></label></section>`;
  form.querySelector<HTMLSelectElement>('[data-setting="homepageMode"]')!.value = settings.homepageMode;
  form.querySelector<HTMLSelectElement>('[data-setting="accentColor"]')!.value = settings.accentColor;
}

async function init(): Promise<void> {
  document.querySelector<HTMLImageElement>('#brand-icon')!.src = chrome.runtime.getURL('icons/icon48.png');
  document.querySelector('#version')!.textContent = VERSION;
  render(await getSettings());
  form.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const key = target.dataset.setting as keyof Settings | undefined;
    if (!key) return;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    render(await updateSettings({ [key]: value } as Partial<Settings>));
  });
  document.querySelector('#reset')!.addEventListener('click', async () => render(await resetSettings()));
}
void init();
