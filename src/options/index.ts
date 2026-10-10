import './options.css';
import { VERSION } from '../shared/constants';
import { getSettings, resetSettings, updateSettings } from '../shared/settings';
import type { Settings } from '../shared/types';
import { getSavedWeatherLocation, saveCurrentWeatherLocation } from './weather-location';

const form = document.querySelector<HTMLFormElement>('#settings-form')!;
let activeSettings: Settings;
let locationFeedback = '';
const cleanup: Array<[keyof Settings, string, string]> = [
  ['cleanerEnabled', '启用界面净化', '关闭后会恢复扩展隐藏的原生入口'], ['hideAds', '隐藏广告与推广', '只处理欢迎页内已验证的广告容器'],
  ['hideAi', '隐藏 AI 入口', '不检查邮件主题或邮件正文'], ['hideMembership', '隐藏会员推广', '保留账户和必要设置入口'],
  ['hideOtherTools', '隐藏其他工具', '优先隐藏 #dvNavFoot 整个分组'], ['hideEnterprisePromotion', '隐藏企业邮箱推广', '不会隐藏真实邮箱账户']
];
const appearance: Array<[keyof Settings, string, string]> = [
  ['themeEnabled', '启用 Apple Mail 风格', '仅改变网易邮箱外围界面'], ['themeHeader', '顶部导航', '搜索和账户操作保持原生'],
  ['themeSidebar', '左侧导航', '不改变侧栏与主内容区几何'], ['themeList', '邮件列表', '保留虚拟列表和批量操作'],
  ['themeCompose', '写信页面', '不覆盖联系人侧栏显示逻辑'], ['themeRead', '阅读页面', '不修改邮件正文或 iframe']
];

function toggle(key: keyof Settings, title: string, help: string, checked: boolean, disabled = false): string {
  return `<label class="row"><span>${title}<small>${help}</small></span><input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}></label>`;
}

function render(settings: Settings): void {
  activeSettings = settings;
  const weatherDisabled = !settings.showWeather;
  const manualCity = settings.weatherLocationMode === 'manual';
  form.innerHTML = `<section class="group"><h2>界面净化</h2><p class="description">范围限定在邮箱 UI，不扫描邮件内容。</p>${cleanup.map(([key, title, help], index) => toggle(key, title, help, Boolean(settings[key]), index > 0 && !settings.cleanerEnabled)).join('')}</section>
  <section class="group"><h2>Apple Mail 外观</h2><p class="description">各页面按独立作用域应用主题。</p>${appearance.map(([key, title, help], index) => toggle(key, title, help, Boolean(settings[key]), index > 0 && !settings.themeEnabled)).join('')}</section>
  <section class="group"><h2>首页与配色</h2><label class="row"><span>首页行为<small>默认安全地通过原生入口进入收件箱</small></span><select data-setting="homepageMode"><option value="inbox">直接进入收件箱</option><option value="minimal-home">极简首页</option><option value="original-home">网易原版首页</option></select></label><label class="row"><span>强调色</span><select data-setting="accentColor"><option value="blue">系统蓝</option><option value="graphite">石墨灰</option><option value="custom">自定义颜色</option></select></label><label class="row"><span>自定义强调色</span><input aria-label="自定义强调色" type="color" data-setting="customAccent" value="${settings.customAccent}"></label></section>
  <section class="group"><h2>天气</h2><p class="description">仅在极简首页的 Today 卡显示。定位只会在你点击下方按钮时请求；坐标仅保存在本机。</p>${toggle('showWeather', '显示天气', '不读取邮件内容，也不会根据 IP 猜测位置', settings.showWeather)}<fieldset class="location-mode" ${weatherDisabled ? 'disabled' : ''}><legend>天气位置</legend><label><input type="radio" name="weatherLocationMode" value="manual" ${manualCity ? 'checked' : ''}> 手动填写城市</label><label><input type="radio" name="weatherLocationMode" value="geolocation" ${manualCity ? '' : 'checked'}> 使用当前位置</label></fieldset><label class="row weather-city-row" ${manualCity ? '' : 'data-inactive="true"'}><span>城市名称<small>例如 Tokyo、北京、上海或 Singapore</small></span><input class="city-input" aria-label="天气城市" type="text" maxlength="80" autocomplete="off" spellcheck="false" data-setting="weatherCity" value="${escapeAttribute(settings.weatherCity)}" placeholder="Tokyo" ${weatherDisabled || !manualCity ? 'disabled' : ''}></label><div class="location-actions"><button type="button" class="location-button" data-action="request-location" ${weatherDisabled ? 'disabled' : ''}>${manualCity ? '使用当前位置' : '更新当前位置'}</button><small data-location-feedback>${locationFeedback || (manualCity ? '手动城市不会请求位置权限' : '当前位置仅用于天气查询，不会同步到其他设备')}</small></div></section>`;
  form.querySelector<HTMLSelectElement>('[data-setting="homepageMode"]')!.value = settings.homepageMode;
  form.querySelector<HTMLSelectElement>('[data-setting="accentColor"]')!.value = settings.accentColor;
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

async function init(): Promise<void> {
  document.querySelector<HTMLImageElement>('#brand-icon')!.src = chrome.runtime.getURL('icons/icon48.png');
  document.querySelector('#version')!.textContent = VERSION;
  const settings = await getSettings();
  if (settings.weatherLocationMode === 'geolocation' && await getSavedWeatherLocation()) {
    locationFeedback = '当前位置已保存，仅保存在本机';
  }
  render(settings);
  form.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.name === 'weatherLocationMode') {
      const mode = target.value === 'geolocation' ? 'geolocation' : 'manual';
      locationFeedback = mode === 'geolocation'
        ? '请点击“更新当前位置”以获取位置权限'
        : '手动城市不会请求位置权限';
      render(await updateSettings({ weatherLocationMode: mode }));
      return;
    }
    const key = target.dataset.setting as keyof Settings | undefined;
    if (!key) return;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    render(await updateSettings({ [key]: value } as Partial<Settings>));
  });
  form.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>('[data-action="request-location"]');
    if (!target || target.disabled) return;
    void updateCurrentLocation();
  });
  document.querySelector('#reset')!.addEventListener('click', async () => render(await resetSettings()));
}

async function updateCurrentLocation(): Promise<void> {
  locationFeedback = '正在请求当前位置…';
  render(activeSettings);
  try {
    await saveCurrentWeatherLocation();
    locationFeedback = '当前位置已保存，仅保存在本机';
    render(await updateSettings({ weatherLocationMode: 'geolocation' }));
  } catch (error) {
    locationFeedback = error instanceof Error ? error.message : '暂时无法获取当前位置，请改用手动城市';
    render(activeSettings);
  }
}
void init();
