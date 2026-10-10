# 163 Mail Minimal

[![CI](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml)
[![Release](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml/badge.svg)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/zhangchengxuv/163-Mail-Apple-Minimal?display_name=tag)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest)

A Manifest V3 browser extension for `mail.163.com` that independently provides interface cleanup and a restrained Apple Mail-inspired theme. It never reads, stores, or uploads email content.

## Highlights

- Independent cleanup and theme switches, stored with `chrome.storage.sync`.
- Scoped CSS for header, sidebar, list, compose, reader, and welcome states.
- Light, dark, and system-following appearance modes for the extension and mailbox chrome; email bodies, images, and iframes are never inverted.
- Four persistent mailbox-chrome font sizes (13–16px) without browser zoom, rich-email font overrides, or virtual-list row-height changes.
- No custom dashboard, history overrides, dynamic-ID selectors, or contact-panel geometry overrides.
- Minimal permissions: `storage`, `geolocation` used only after an explicit Options-page action, `https://mail.163.com/*`, and two narrowly scoped Open-Meteo endpoints used only for optional weather.
- Static local assets only; no remote code, analytics, or ads.

## Weather in the minimal home

When **Minimal home** is selected, the Today card can show weather for a manually entered city (default: `Tokyo`) or an explicitly saved current position. Manual-city mode never requests location and never uses IP geolocation. Current-position mode can only be triggered by clicking **Use current location** or **Update current location** in Options; it does not request location when mail opens, the SPA changes page, or a background refresh runs. The coordinates remain in local-only `chrome.storage.local` and are not synced. Manual-city mode sends only the city name to Open-Meteo's geocoding and forecast endpoints; current-position mode sends only the saved coordinates to the forecast endpoint. Neither mode sends email content. Weather data is cached locally for 30 minutes, with a matching stale-cache fallback on network failure.

The required, narrowly scoped host permissions are `https://geocoding-api.open-meteo.com/*` and `https://api.open-meteo.com/*`. Weather data is supplied by [Open-Meteo's Geocoding API](https://open-meteo.com/en/docs/geocoding-api) and [Forecast API](https://open-meteo.com/en/docs). You can turn weather off or change the city in Options.

## Appearance modes

Choose **Light**, **Dark**, or **System** in the popup or Options page. System is the default and follows `prefers-color-scheme` while the mailbox is open, without refetching weather or reloading the list. Dark mode uses scoped CSS variables for the NetEase shell, Today card, and extension settings only. It deliberately leaves HTML email bodies, images, signatures, tables, iframe documents, and rich-text editor content untouched.

Choose the UI size in **Options → Home and color**: 13px compact, 14px standard, 15px large, or 16px extra large. The setting applies to mailbox chrome such as navigation, list metadata, toolbar labels, Today, and compose controls. It does not use browser zoom and does not modify message-body typography or virtual-list row height.

## Build and install

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Open `edge://extensions` or `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`. The release archive is generated at `release/163-mail-minimal-v1.3.0.zip`.

See [GitHub Releases](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest) for the latest stable download. A Release ZIP is an unpacked developer-mode extension package, not a one-click Chrome Web Store or Edge Add-ons installer.

## CI/CD

- The [CI workflow](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml) runs on pushes to `main`, pull requests, and manual dispatch. It uses `npm ci`, type checking, linting, unit tests, the production build, and Manifest/version/archive validation. It only uploads a short-lived build artifact and never publishes a Release.
- The [Release workflow](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml) runs only after a stable `vX.Y.Z` Tag is pushed. It validates the Tag, package, source Manifest, and built Manifest versions, rebuilds the archive, writes SHA256, and creates a public GitHub Release through the built-in `GITHUB_TOKEN`.
- For a manual build, open **Actions → CI → Run workflow**. It builds and tests only; it cannot publish a Release.

### Releasing the next version

1. Update both `package.json` and `public/manifest.json` to the same version, for example `1.1.3`.
2. Run `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run validate:version`, and `npm run validate:release`.
3. Commit and push the version change to `main`.
4. Create and push an annotated Tag for the already pushed commit: `git tag -a v1.1.3 -m "163 Mail Minimal v1.1.3"`, then `git push 163-Mail-·-Apple-Minimal v1.1.3`.
5. The workflow refuses non-stable Tags, mismatched versions, missing Tags, existing Releases, and any failed quality gate. Fix the issue and publish a new version; never overwrite a Tag or Release asset.

### Common failures

- `npm ci` fails: run `npm install` locally and commit the matching `package-lock.json`.
- Version validation fails: the Tag without `v`, `package.json`, `public/manifest.json`, and `dist/manifest.json` must match exactly.
- Archive validation fails: run `npm run build` then `npm run validate:release`; do not zip the source repository manually.
- Release receives HTTP 403: verify **Settings → Actions → General → Workflow permissions** permits the built-in `GITHUB_TOKEN` to write Releases. No personal access token is required.

## Limits

Static fixtures cannot prove compatibility with a logged-in mailbox. Unverified dynamic advert structures are deliberately skipped instead of broadly scanning mail content. See the Chinese [README](README.md) for the manual verification checklist and full privacy statement.

## License

[MIT](LICENSE)
