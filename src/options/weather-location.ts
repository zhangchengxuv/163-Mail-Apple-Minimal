import { isSavedWeatherLocation, WEATHER_LOCATION_KEY, type SavedWeatherLocation } from '../shared/weather-types';

type LocalStorageArea = Pick<chrome.storage.StorageArea, 'get' | 'set'>;

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000
};

function localStorage(): LocalStorageArea | undefined {
  return globalThis.chrome?.storage?.local;
}

export async function getSavedWeatherLocation(): Promise<SavedWeatherLocation | null> {
  const storage = localStorage();
  if (!storage) return null;
  const result = await storage.get(WEATHER_LOCATION_KEY);
  return isSavedWeatherLocation(result[WEATHER_LOCATION_KEY]) ? result[WEATHER_LOCATION_KEY] : null;
}

export async function saveCurrentWeatherLocation(
  geolocation: Geolocation | undefined = globalThis.navigator?.geolocation
): Promise<SavedWeatherLocation> {
  if (!geolocation) throw new Error('定位在此浏览器中不可用');
  const position = await requestPosition(geolocation);
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('定位结果无效');

  const location: SavedWeatherLocation = {
    latitude,
    longitude,
    label: '当前位置',
    updatedAt: Date.now()
  };
  const storage = localStorage();
  if (!storage) throw new Error('无法保存定位结果');
  await storage.set({ [WEATHER_LOCATION_KEY]: location });
  return location;
}

function requestPosition(geolocation: Geolocation): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, (error) => reject(new Error(locationErrorMessage(error))), POSITION_OPTIONS);
  });
}

function locationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return '未授予位置权限，请改用手动城市';
  if (error.code === error.TIMEOUT) return '定位超时，请重试或改用手动城市';
  return '暂时无法获取当前位置，请改用手动城市';
}
