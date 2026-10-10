import type { Settings } from '../../shared/types';
import type { WeatherLookupResult } from '../../shared/weather-types';
import { findWelcomeInner, findWelcomeRoot, WELCOME_INFO_PANEL_SELECTOR } from './welcome-dom';
import { requestWeather } from './weather-client';

const CARD_ATTRIBUTE = 'data-mail-minimal-card';
const weatherRequests = new WeakMap<HTMLElement, number>();

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
  syncWeather(card, settings);
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
  card.innerHTML = `<div class="mail-minimal-today-layout"><div class="mail-minimal-today-main"><div class="mail-minimal-today-heading"><div><p>Today</p><h2>今日概览</h2></div><time></time></div><div class="mail-minimal-today-stats"><span data-stat="unread"><b>—</b>未读邮件</span><span data-stat="drafts"><b>—</b>草稿</span></div><div class="mail-minimal-today-actions"><button type="button" data-action="inbox">打开收件箱</button><button type="button" data-action="compose">写邮件</button></div></div><aside class="mail-minimal-today-weather" data-weather hidden aria-live="polite"><span class="mail-minimal-weather-symbol" data-weather-symbol aria-hidden="true"></span><div class="mail-minimal-weather-copy"><p data-weather-city>天气</p><strong data-weather-temperature></strong><span data-weather-description></span><small data-weather-detail></small></div></aside></div>`;
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
  const formatted = new Intl.DateTimeFormat('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
  }).format(now);
  if (time && time.textContent !== formatted) time.textContent = formatted;
  setStat(card, 'unread', countFolder(documentRef, '收件箱'));
  setStat(card, 'drafts', countFolder(documentRef, '草稿箱'));
}

function syncWeather(card: HTMLElement, settings: Settings): void {
  const panel = card.querySelector<HTMLElement>('[data-weather]');
  if (!panel) return;
  if (!settings.showWeather) {
    panel.hidden = true;
    card.removeAttribute('data-weather-source');
    card.removeAttribute('data-weather-loading');
    return;
  }

  const isGeolocation = settings.weatherLocationMode === 'geolocation';
  const city = settings.weatherCity.trim();
  if (!isGeolocation && !city) {
    renderWeatherUnavailable(panel, '请在高级设置中填写城市');
    return;
  }
  const requestKey = isGeolocation ? 'geolocation' : `manual:${city}`;
  const fallbackLabel = isGeolocation ? '当前位置' : city;
  if (card.dataset.weatherSource === requestKey && card.dataset.weatherLoading === 'true') return;
  if (card.dataset.weatherSource === requestKey && panel.dataset.state === 'ready') return;

  card.dataset.weatherSource = requestKey;
  card.dataset.weatherLoading = 'true';
  const requestId = (weatherRequests.get(card) ?? 0) + 1;
  weatherRequests.set(card, requestId);
  renderWeatherLoading(panel, fallbackLabel);
  void requestWeather(settings.weatherLocationMode, city).then((result) => {
    if (!card.isConnected || weatherRequests.get(card) !== requestId || card.dataset.weatherSource !== requestKey) return;
    card.dataset.weatherLoading = 'false';
    renderWeather(panel, result, fallbackLabel);
  });
}

function renderWeather(panel: HTMLElement, result: WeatherLookupResult, fallbackCity: string): void {
  if (!result.weather) {
    renderWeatherUnavailable(panel, result.reason === 'location-unavailable' ? '请在高级设置中使用当前位置' : '天气暂不可用', fallbackCity);
    return;
  }
  panel.hidden = false;
  panel.dataset.state = 'ready';
  setText(panel, '[data-weather-symbol]', result.weather.symbol);
  setText(panel, '[data-weather-city]', result.weather.city);
  setText(panel, '[data-weather-temperature]', `${result.weather.temperatureC}°C`);
  setText(panel, '[data-weather-description]', result.weather.description);
  const details = [
    result.weather.apparentTemperatureC === undefined ? '' : `体感 ${result.weather.apparentTemperatureC}°C`,
    result.weather.humidity === undefined ? '' : `湿度 ${result.weather.humidity}%`,
    result.cacheState === 'stale' ? '缓存数据' : ''
  ].filter(Boolean).join(' · ');
  setText(panel, '[data-weather-detail]', details);
}

function renderWeatherLoading(panel: HTMLElement, city: string): void {
  panel.hidden = false;
  panel.dataset.state = 'loading';
  setText(panel, '[data-weather-symbol]', '○');
  setText(panel, '[data-weather-city]', city);
  setText(panel, '[data-weather-temperature]', '');
  setText(panel, '[data-weather-description]', '正在更新天气');
  setText(panel, '[data-weather-detail]', '');
}

function renderWeatherUnavailable(panel: HTMLElement, description: string, city = '天气'): void {
  panel.hidden = false;
  panel.dataset.state = 'unavailable';
  setText(panel, '[data-weather-symbol]', '○');
  setText(panel, '[data-weather-city]', city);
  setText(panel, '[data-weather-temperature]', '');
  setText(panel, '[data-weather-description]', description);
  setText(panel, '[data-weather-detail]', '');
}

function setText(scope: ParentNode, selector: string, value: string): void {
  const target = scope.querySelector<HTMLElement>(selector);
  if (target && target.textContent !== value) target.textContent = value;
}

function setStat(card: HTMLElement, name: string, count: number | undefined): void {
  const target = card.querySelector<HTMLElement>(`[data-stat="${name}"] b`);
  const value = count === undefined ? '—' : String(count);
  if (target && target.textContent !== value) target.textContent = value;
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
