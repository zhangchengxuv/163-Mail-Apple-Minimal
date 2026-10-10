import { ACCENTS, DEFAULT_SETTINGS, STORAGE_KEY } from './constants';
import type { Settings } from './types';

type StorageArea = Pick<chrome.storage.StorageArea, 'get' | 'set'>;

function storage(): StorageArea | undefined {
  return globalThis.chrome?.storage?.sync;
}

export function normalizeSettings(value: Partial<Settings> | undefined): Settings {
  const candidate = { ...DEFAULT_SETTINGS, ...value };
  const customAccent = /^#[0-9a-f]{6}$/i.test(candidate.customAccent)
    ? candidate.customAccent.toUpperCase()
    : DEFAULT_SETTINGS.customAccent;
  const weatherCity = typeof candidate.weatherCity === 'string'
    ? candidate.weatherCity.trim().replace(/\s+/g, ' ').slice(0, 80)
    : DEFAULT_SETTINGS.weatherCity;
  const weatherLocationMode = candidate.weatherLocationMode === 'geolocation' ? 'geolocation' : 'manual';
  return { ...candidate, customAccent, weatherCity, weatherLocationMode, showWeather: Boolean(candidate.showWeather) };
}

export function accentValue(settings: Settings): string {
  if (settings.accentColor === 'custom') return settings.customAccent;
  return ACCENTS[settings.accentColor];
}

export async function getSettings(): Promise<Settings> {
  const area = storage();
  if (!area) return { ...DEFAULT_SETTINGS };
  const result = await area.get(STORAGE_KEY);
  return normalizeSettings(result[STORAGE_KEY] as Partial<Settings> | undefined);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = normalizeSettings({ ...(await getSettings()), ...patch });
  const area = storage();
  if (area) await area.set({ [STORAGE_KEY]: next });
  return next;
}

export async function resetSettings(): Promise<Settings> {
  const next = { ...DEFAULT_SETTINGS };
  const area = storage();
  if (area) await area.set({ [STORAGE_KEY]: next });
  return next;
}
