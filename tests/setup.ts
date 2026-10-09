import { beforeEach } from 'vitest';

type Listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void;
let stored: Record<string, unknown> = {};
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
      onChanged: { addListener: (listener: Listener) => listeners.push(listener) }
    },
    tabs: { query: async () => [] }
  }
});

beforeEach(() => {
  stored = {};
  document.documentElement.innerHTML = '<head></head><body></body>';
});
