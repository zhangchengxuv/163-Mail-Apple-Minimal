# 163 Mail Minimal

A Manifest V3 browser extension for `mail.163.com` that independently provides interface cleanup and a restrained Apple Mail-inspired theme. It never reads, stores, or uploads email content.

## Highlights

- Independent cleanup and theme switches, stored with `chrome.storage.sync`.
- Scoped CSS for header, sidebar, list, compose, reader, and welcome states.
- No custom dashboard, history overrides, dynamic-ID selectors, or contact-panel geometry overrides.
- Minimal permissions: `storage` and `https://mail.163.com/*` only.
- Static local assets only; no remote code, analytics, or ads.

## Build and install

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Open `edge://extensions` or `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/`. The release archive is generated at `release/163-mail-minimal-v1.1.1.zip`.

## Limits

Static fixtures cannot prove compatibility with a logged-in mailbox. Unverified dynamic advert structures are deliberately skipped instead of broadly scanning mail content. See the Chinese [README](README.md) for the manual verification checklist and full privacy statement.

## License

[MIT](LICENSE)
