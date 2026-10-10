import { describe, expect, it, vi } from 'vitest';
import { WEATHER_CACHE_TTL_MS, createWeatherService, type WeatherStorage } from '../../src/background/weather-service';
import { WEATHER_CACHE_KEY, type WeatherSummary } from '../../src/shared/weather-types';

const now = 1_800_000_000_000;
const cachedWeather: WeatherSummary = {
  city: 'Tokyo', temperatureC: 20, apparentTemperatureC: 21, humidity: 55,
  weatherCode: 2, description: '局部多云', symbol: '⛅', updatedAt: now - 1_000
};

function memoryStorage(initial: Record<string, unknown> = {}): WeatherStorage & { values: Record<string, unknown> } {
  const values = { ...initial };
  return {
    values,
    get: async (key) => ({ [key]: values[key] }),
    set: async (next) => { Object.assign(values, next); }
  };
}

function weatherFetcher(temperature = 24) {
  return vi.fn(async (url: string) => {
    if (url.startsWith('https://geocoding-api.open-meteo.com/')) {
      return { ok: true, json: async () => ({ results: [{ name: 'Tokyo', latitude: 35.68, longitude: 139.69 }] }) };
    }
    return { ok: true, json: async () => ({ current: { temperature_2m: temperature, apparent_temperature: temperature + 1, relative_humidity_2m: 58, weather_code: 2, is_day: 1 } }) };
  });
}

describe('weather service', () => {
  it('does not request a weather API when city is empty', async () => {
    const fetcher = weatherFetcher();
    const service = createWeatherService({ storage: memoryStorage(), fetcher, now: () => now });

    await expect(service.getWeather('   ')).resolves.toEqual({ weather: null, cacheState: 'unavailable' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('geocodes a city, fetches current Celsius weather, and writes a cache', async () => {
    const storage = memoryStorage();
    const fetcher = weatherFetcher(24);
    const service = createWeatherService({ storage, fetcher, now: () => now });

    const result = await service.getWeather('Tokyo');

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.weather).toMatchObject({ city: 'Tokyo', temperatureC: 24, apparentTemperatureC: 25, humidity: 58, description: '局部多云' });
    expect(result.cacheState).toBe('fresh');
    expect(storage.values[WEATHER_CACHE_KEY]).toMatchObject({ cityKey: 'tokyo', weather: { temperatureC: 24 } });
  });

  it('uses a matching fresh cache without another request', async () => {
    const fetcher = weatherFetcher();
    const storage = memoryStorage({ [WEATHER_CACHE_KEY]: { cityKey: 'tokyo', weather: cachedWeather } });
    const service = createWeatherService({ storage, fetcher, now: () => now });

    const result = await service.getWeather(' Tokyo ');

    expect(result).toEqual({ weather: cachedWeather, cacheState: 'fresh' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refreshes expired cache and falls back to expired data when the API fails', async () => {
    const expired = { ...cachedWeather, updatedAt: now - WEATHER_CACHE_TTL_MS - 1 };
    const refreshedStorage = memoryStorage({ [WEATHER_CACHE_KEY]: { cityKey: 'tokyo', weather: expired } });
    const refreshedService = createWeatherService({ storage: refreshedStorage, fetcher: weatherFetcher(29), now: () => now });
    await expect(refreshedService.getWeather('Tokyo')).resolves.toMatchObject({ cacheState: 'fresh', weather: { temperatureC: 29 } });

    const failedStorage = memoryStorage({ [WEATHER_CACHE_KEY]: { cityKey: 'tokyo', weather: expired } });
    const failedService = createWeatherService({ storage: failedStorage, fetcher: vi.fn(async () => { throw new Error('offline'); }), now: () => now });
    await expect(failedService.getWeather('Tokyo')).resolves.toEqual({ weather: expired, cacheState: 'stale' });
  });

  it('returns unavailable when an uncached weather request fails', async () => {
    const service = createWeatherService({ storage: memoryStorage(), fetcher: vi.fn(async () => { throw new Error('offline'); }), now: () => now });
    await expect(service.getWeather('Singapore')).resolves.toEqual({ weather: null, cacheState: 'unavailable' });
  });
});
