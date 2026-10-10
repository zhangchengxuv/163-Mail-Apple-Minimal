# 163 Mail Minimal

A Manifest V3 browser extension for `mail.163.com` that independently provides interface cleanup and a restrained Apple Mail-inspired theme. It never reads, stores, or uploads email content.

## Highlights

- Independent cleanup and theme switches, stored with `chrome.storage.sync`.
- Scoped CSS for header, sidebar, list, compose, reader, and welcome states.
- No custom dashboard, history overrides, dynamic-ID selectors, or contact-panel geometry overrides.
- Minimal permissions: `storage`, `geolocation` used only after an explicit Options-page action, `https://mail.163.com/*`, and two narrowly scoped Open-Meteo endpoints used only for optional weather.
- Static local assets only; no remote code, analytics, or ads.

## Weather in the minimal home

When **Minimal home** is selected, the Today card can show weather for a manually entered city (default: `Tokyo`) or an explicitly saved current position. Manual-city mode never requests location and never uses IP geolocation. Current-position mode can only be triggered by clicking **Use current location** or **Update current location** in Options; it does not request location when mail opens, the SPA changes page, or a background refresh runs. The coordinates remain in local-only `chrome.storage.local` and are not synced. Manual-city mode sends only the city name to Open-Meteo's geocoding and forecast endpoints; current-position mode sends only the saved coordinates to the forecast endpoint. Neither mode sends email content. Weather data is cached locally for 30 minutes, with a matching stale-cache fallback on network failure.

The required, narrowly scoped host permissions are `https://geocoding-api.open-meteo.com/*` and `https://api.open-meteo.com/*`. Weather data is supplied by [Open-Meteo's Geocoding API](https://open-meteo.com/en/docs/geocoding-api) and [Forecast API](https://open-meteo.com/en/docs). You can turn weather off or change the city in Options.

## Build and install

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Open `edge://extensions` or `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`. The release archive is generated at `release/163-mail-minimal-v1.1.2.zip`.

## Limits

Static fixtures cannot prove compatibility with a logged-in mailbox. Unverified dynamic advert structures are deliberately skipped instead of broadly scanning mail content. See the Chinese [README](README.md) for the manual verification checklist and full privacy statement.

## License

[MIT](LICENSE)
