import { beforeEach } from 'vitest';

type Listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void;
let stored: Record<string, unknown> = {};
let localStored: Record<string, unknown> = {};
const listeners: Listener[] = [];

Object.defineProperty(globalThis, 'chrome', {
  configurable: true,
  value: {
    storage: {
      sync: {
        get: async (key: string) => ({ [key]: stored[key] }),
        set: async (next: Record<string, unknown>) => {
          const changes: Record<string, chrome.storage.StorageChange> = {};
          for (const [key, value] of Object.entries(next)) {
            changes[key] = { oldValue: stored[key], newValue: value };
            stored[key] = value;
          }
          listeners.forEach((listener) => listener(changes, 'sync'));
        }
      },
      local: {
        get: async (key: string) => ({ [key]: localStored[key] }),
        set: async (next: Record<string, unknown>) => { localStored = { ...localStored, ...next }; }
      },
      onChanged: { addListener: (listener: Listener) => listeners.push(listener) }
    },
    tabs: { query: async () => [], sendMessage: async () => ({ ready: true, page: 'list' }) },
    runtime: {
      getURL: (path: string) => path,
      openOptionsPage: async () => undefined,
      sendMessage: async (message: { city?: string; locationMode?: string }) => ({
        weather: { city: message.locationMode === 'geolocation' ? '当前位置' : message.city || 'Tokyo', temperatureC: message.city === 'Singapore' ? 30 : 24, apparentTemperatureC: message.city === 'Singapore' ? 31 : 25, humidity: 58, weatherCode: 2, description: '局部多云', symbol: '⛅', updatedAt: Date.now() },
        cacheState: 'fresh'
      })
    }
  }
});

beforeEach(() => {
  stored = {};
  localStored = {};
  document.documentElement.innerHTML = '<head></head><body></body>';
});
