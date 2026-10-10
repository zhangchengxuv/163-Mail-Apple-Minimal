import { describe, expect, it, vi } from 'vitest';
import { WEATHER_CACHE_TTL_MS, createWeatherService, type WeatherStorage } from '../../src/background/weather-service';
import { WEATHER_CACHE_KEY, type SavedWeatherLocation, type WeatherSummary } from '../../src/shared/weather-types';

const now = 1_800_000_000_000;
const cachedWeather: WeatherSummary = {
  city: 'Tokyo', temperatureC: 20, apparentTemperatureC: 21, humidity: 55,
  weatherCode: 2, description: '局部多云', symbol: '⛅', updatedAt: now - 1_000
};
const savedLocation: SavedWeatherLocation = { latitude: 1.3521, longitude: 103.8198, label: '当前位置', updatedAt: now };

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

    await expect(service.getWeather({ mode: 'manual', city: '   ' })).resolves.toEqual({ weather: null, cacheState: 'unavailable' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('geocodes a city, fetches current Celsius weather, and writes a cache', async () => {
    const storage = memoryStorage();
    const fetcher = weatherFetcher(24);
    const service = createWeatherService({ storage, fetcher, now: () => now });

    const result = await service.getWeather({ mode: 'manual', city: 'Tokyo' });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.weather).toMatchObject({ city: 'Tokyo', temperatureC: 24, apparentTemperatureC: 25, humidity: 58, description: '局部多云' });
    expect(result.cacheState).toBe('fresh');
    expect(storage.values[WEATHER_CACHE_KEY]).toMatchObject({ sourceKey: 'manual:tokyo', weather: { temperatureC: 24 } });
  });

  it('uses a matching fresh cache without another request', async () => {
    const fetcher = weatherFetcher();
    const storage = memoryStorage({ [WEATHER_CACHE_KEY]: { sourceKey: 'manual:tokyo', weather: cachedWeather } });
    const service = createWeatherService({ storage, fetcher, now: () => now });

    const result = await service.getWeather({ mode: 'manual', city: ' Tokyo ' });

    expect(result).toEqual({ weather: cachedWeather, cacheState: 'fresh' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refreshes expired cache and falls back to expired data when the API fails', async () => {
    const expired = { ...cachedWeather, updatedAt: now - WEATHER_CACHE_TTL_MS - 1 };
    const refreshedStorage = memoryStorage({ [WEATHER_CACHE_KEY]: { sourceKey: 'manual:tokyo', weather: expired } });
    const refreshedService = createWeatherService({ storage: refreshedStorage, fetcher: weatherFetcher(29), now: () => now });
    await expect(refreshedService.getWeather({ mode: 'manual', city: 'Tokyo' })).resolves.toMatchObject({ cacheState: 'fresh', weather: { temperatureC: 29 } });

    const failedStorage = memoryStorage({ [WEATHER_CACHE_KEY]: { sourceKey: 'manual:tokyo', weather: expired } });
    const failedService = createWeatherService({ storage: failedStorage, fetcher: vi.fn(async () => { throw new Error('offline'); }), now: () => now });
    await expect(failedService.getWeather({ mode: 'manual', city: 'Tokyo' })).resolves.toEqual({ weather: expired, cacheState: 'stale' });
  });

  it('returns unavailable when an uncached weather request fails', async () => {
    const service = createWeatherService({ storage: memoryStorage(), fetcher: vi.fn(async () => { throw new Error('offline'); }), now: () => now });
    await expect(service.getWeather({ mode: 'manual', city: 'Singapore' })).resolves.toEqual({ weather: null, cacheState: 'unavailable' });
  });

  it('uses locally saved coordinates without sending them to the city geocoder', async () => {
    const storage = memoryStorage();
    const fetcher = weatherFetcher(31);
    const service = createWeatherService({ storage, fetcher, now: () => now });

    const result = await service.getWeather({ mode: 'geolocation', location: savedLocation });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toContain('latitude=1.3521');
    expect(fetcher.mock.calls[0]?.[0]).toContain('longitude=103.8198');
    expect(result).toMatchObject({ cacheState: 'fresh', weather: { city: '当前位置', temperatureC: 31 } });
    expect(storage.values[WEATHER_CACHE_KEY]).toMatchObject({ sourceKey: 'geolocation:1.352:103.820' });
  });

  it('does not request weather when location mode has no saved coordinate', async () => {
    const fetcher = weatherFetcher();
    const service = createWeatherService({ storage: memoryStorage(), fetcher, now: () => now });

    await expect(service.getWeather({ mode: 'geolocation', location: null })).resolves.toEqual({
      weather: null, cacheState: 'unavailable', reason: 'location-unavailable'
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
