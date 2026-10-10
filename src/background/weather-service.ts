import { WEATHER_CACHE_KEY, type WeatherLookupResult, type WeatherSummary } from '../shared/weather-types';

export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;

export interface WeatherStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(value: Record<string, unknown>): Promise<void>;
}

export type WeatherFetcher = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

interface WeatherCache {
  cityKey: string;
  weather: WeatherSummary;
}

interface ServiceDependencies {
  storage?: WeatherStorage;
  fetcher?: WeatherFetcher;
  now?: () => number;
}

interface GeocodingResponse {
  results?: Array<{ name?: string; latitude?: number; longitude?: number }>;
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

export function createWeatherService(dependencies: ServiceDependencies = {}) {
  const storage = dependencies.storage ?? globalThis.chrome?.storage?.local;
  const fetcher = dependencies.fetcher ?? globalThis.fetch.bind(globalThis);
  const now = dependencies.now ?? Date.now;

  return {
    async getWeather(cityInput: string): Promise<WeatherLookupResult> {
      const city = normalizeCity(cityInput);
      if (!city || !storage) return unavailable();

      const cached = await readCache(storage, city);
      if (cached && now() - cached.updatedAt < WEATHER_CACHE_TTL_MS) {
        return { weather: cached, cacheState: 'fresh' };
      }

      try {
        const weather = await fetchWeather(city, fetcher, now);
        await storage.set({ [WEATHER_CACHE_KEY]: { cityKey: cityKey(city), weather } satisfies WeatherCache });
        return { weather, cacheState: 'fresh' };
      } catch {
        return cached ? { weather: cached, cacheState: 'stale' } : unavailable();
      }
    }
  };
}

export function normalizeCity(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function describeWeatherCode(code: number, isDay = true): { description: string; symbol: string } {
  if (code === 0) return isDay ? { description: '晴朗', symbol: '☀' } : { description: '晴夜', symbol: '☾' };
  if (code === 1) return { description: '大致晴朗', symbol: isDay ? '🌤' : '☾' };
  if (code === 2) return { description: '局部多云', symbol: '⛅' };
  if (code === 3) return { description: '多云', symbol: '☁' };
  if (code === 45 || code === 48) return { description: '有雾', symbol: '🌫' };
  if ([51, 53, 55, 56, 57].includes(code)) return { description: '毛毛雨', symbol: '🌦' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { description: '有雨', symbol: '☂' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { description: '有雪', symbol: '❄' };
  if ([95, 96, 99].includes(code)) return { description: '雷雨', symbol: '⚡' };
  return { description: '天气未知', symbol: '○' };
}

async function readCache(storage: WeatherStorage, city: string): Promise<WeatherSummary | null> {
  const result = await storage.get(WEATHER_CACHE_KEY);
  const cache = result[WEATHER_CACHE_KEY] as Partial<WeatherCache> | undefined;
  if (!cache || cache.cityKey !== cityKey(city) || !isWeatherSummary(cache.weather)) return null;
  return cache.weather;
}

async function fetchWeather(city: string, fetcher: WeatherFetcher, now: () => number): Promise<WeatherSummary> {
  const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geocodingUrl.searchParams.set('name', city);
  geocodingUrl.searchParams.set('count', '1');
  geocodingUrl.searchParams.set('language', 'zh');
  geocodingUrl.searchParams.set('format', 'json');
  const geocoding = await fetchJson<GeocodingResponse>(geocodingUrl, fetcher);
  const place = geocoding.results?.[0];
  if (!isFiniteNumber(place?.latitude) || !isFiniteNumber(place?.longitude)) throw new Error('Weather city was not found');

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(place.latitude));
  forecastUrl.searchParams.set('longitude', String(place.longitude));
  forecastUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day');
  forecastUrl.searchParams.set('temperature_unit', 'celsius');
  forecastUrl.searchParams.set('timezone', 'auto');
  const forecast = await fetchJson<ForecastResponse>(forecastUrl, fetcher);
  const current = forecast.current;
  if (!isFiniteNumber(current?.temperature_2m) || !isFiniteNumber(current?.weather_code)) throw new Error('Weather response was incomplete');

  const condition = describeWeatherCode(current.weather_code, current.is_day !== 0);
  return {
    city: place.name?.trim() || city,
    temperatureC: Math.round(current.temperature_2m),
    apparentTemperatureC: isFiniteNumber(current.apparent_temperature) ? Math.round(current.apparent_temperature) : undefined,
    humidity: isFiniteNumber(current.relative_humidity_2m) ? Math.round(current.relative_humidity_2m) : undefined,
    weatherCode: current.weather_code,
    description: condition.description,
    symbol: condition.symbol,
    updatedAt: now()
  };
}

async function fetchJson<T>(url: URL, fetcher: WeatherFetcher): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetcher(url.toString(), { signal: controller.signal });
    if (!response.ok) throw new Error('Weather request failed');
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function cityKey(city: string): string {
  return city.toLocaleLowerCase();
}

function unavailable(): WeatherLookupResult {
  return { weather: null, cacheState: 'unavailable' };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isWeatherSummary(value: unknown): value is WeatherSummary {
  if (!value || typeof value !== 'object') return false;
  const weather = value as Partial<WeatherSummary>;
  return typeof weather.city === 'string'
    && isFiniteNumber(weather.temperatureC)
    && isFiniteNumber(weather.weatherCode)
    && typeof weather.description === 'string'
    && typeof weather.symbol === 'string'
    && isFiniteNumber(weather.updatedAt);
}
