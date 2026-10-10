export type WeatherCacheState = 'fresh' | 'stale' | 'unavailable';
export type WeatherLocationMode = 'manual' | 'geolocation';
export type WeatherUnavailableReason = 'location-unavailable';

export interface SavedWeatherLocation {
  latitude: number;
  longitude: number;
  label: '当前位置';
  updatedAt: number;
}

export type WeatherSource =
  | { mode: 'manual'; city: string }
  | { mode: 'geolocation'; location: SavedWeatherLocation | null };

export interface WeatherSummary {
  city: string;
  temperatureC: number;
  apparentTemperatureC?: number;
  humidity?: number;
  weatherCode: number;
  description: string;
  symbol: string;
  updatedAt: number;
}

export interface WeatherLookupResult {
  weather: WeatherSummary | null;
  cacheState: WeatherCacheState;
  reason?: WeatherUnavailableReason;
}

export interface WeatherRequest {
  type: 'mail-minimal:weather:get';
  locationMode: WeatherLocationMode;
  city: string;
}

export const WEATHER_CACHE_KEY = 'mail-minimal-weather-cache-v1';
export const WEATHER_LOCATION_KEY = 'mail-minimal-weather-location-v1';

export function isSavedWeatherLocation(value: unknown): value is SavedWeatherLocation {
  if (!value || typeof value !== 'object') return false;
  const location = value as Partial<SavedWeatherLocation>;
  return Number.isFinite(location.latitude)
    && Number.isFinite(location.longitude)
    && location.latitude! >= -90
    && location.latitude! <= 90
    && location.longitude! >= -180
    && location.longitude! <= 180
    && location.label === '当前位置'
    && Number.isFinite(location.updatedAt);
}
