# Codevenient Workspace 2.0

A React + Vite business workspace for desktop and phone. JavaScript/JSX only.

## Start on your PC

Install Node.js 22.12+ (Node 24 also works), then extract this folder. In its terminal:

```sh
npm ci
npm run dev
```

Open the localhost URL Vite prints. To test the installable/offline build:

```sh
npm run build
npm run preview
```

Use localhost, not a `file://` URL. The included `dist` directory is already built and can be served by a static web server. To access the development app from your phone on the same Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open your PC's LAN address and the Vite port. This HTTP development connection does not enable installation or offline caching. For those features, use an HTTPS deployment.

## Before using it for real work

1. Review the original invoices. They are starting records from your uploaded code, not newly verified accounts. Several dates omit years. Edit those records and confirm their amounts and payment statuses.
2. Add payment details in Settings only if you want them included in invoice PDFs. These details are saved with the signed-in workspace.
3. New invoices default to 0% tax. Enter the rate applicable to your business. Existing invoices retain their original values.
4. In Settings, download a backup. Keep regular backups outside the browser.
5. If your old app used the same origin and storage key, its saved records are loaded. Different ports, domains, and browser profiles have separate storage. The ZIP cannot contain edits that only existed in your previous browser's local storage.

## Install on PC and phone

Host the contents of `dist` behind HTTPS. GitHub Pages serves the app shell publicly; Firebase sign-in and Firestore rules must protect workspace records. See [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) before publishing. Then:

- Windows: open in Chrome or Edge; choose Install in the address bar or browser menu.
- Android: open in Chrome; choose Add to Home screen / Install.
- iPhone: open in Safari; Share → Add to Home Screen.

This delivery is a progressive web app, not a signed APK or Windows executable. It runs in its own app window after installation. Offline loading works after a successful online load and service-worker installation. The app caches its own files, not cloud API responses.

After deploying an update, close all app windows/tabs and reopen while online to activate the new offline version. A service worker intentionally waits for the old windows to close to avoid replacing files in the middle of an edit.

For a subfolder host, set `VITE_BASE_PATH=/your-folder/` before building. Relative paths are the default. No hosting account has been changed or deployment published as part of this delivery.

## PC–phone sync

The app uses Firebase Authentication and Firestore for the signed-in workspace. Configure Firebase and approve accounts as described in [FIREBASE-SETUP.md](./FIREBASE-SETUP.md), then sign in on each device with the same approved account. Changes sync automatically while online; offline edits remain on the device until reconnection. Use Settings to download independent backups.

Cloud sync stores a whole-workspace snapshot and rejects stale writes rather than merging concurrent edits. Review conflict prompts and back up before restoring or replacing data. Local browser caches remain on the device after sign-out, so use device security on shared machines.

PWA installation:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

## What works

- Responsive overview; light/dark themes; mobile navigation.
- Projects with search, status filter, creation, edits and deletion.
- Client directory with validated email fields and CSV export.
- Tasks with due dates, priorities, completion and filters.
- Expenses with categories, totals, search and CSV export.
- Invoices with editable line items, dates, rates and statuses; automatic overdue display for ISO dates; branded PDF export with long-item wrapping and pagination.
- Email drafting via your mail application. Download the PDF and attach it yourself. No email is sent automatically.
- Existing business documents, contract builder, business plan and note content retained; PDF exports retained.
- Global search opens the matching section; use section filters to locate the record.
- Versioned JSON backup/restore, recovery export and visible local-save errors.
- Deleted starting notes and proposals stay deleted after reload.
- Offline app shell, installation manifest and icons.

## Deliberate limits

- No automatic invoice emailing, payment collection or scheduled recurring billing. Old recurring flags are retained in data for reference; they do not create invoices.
- No bank feed, bookkeeping reconciliation, payroll, partial payments, credit notes or formal accounting reports. The cash snapshot is collected invoices less recorded expenses across all dates.
- The app has no screen-blurring privacy toggle. Firebase sign-in and Firestore rules protect cloud records; the GitHub Pages app shell itself is public. Sign out on shared devices.
- The previous optional GA panel and decorative gauges were removed from the overview. The overview now uses actual workspace records.
- No background notifications, native APK signing or Play Store submission.

## Development

```sh
npm test
npm run lint
npm run build
```

`src/lib/model.js` contains money, overdue-date and backup validation logic. `src/store.jsx` owns cloud workspace persistence. `src/views` contains the screens. `src/lib/firebase.js` configures Firebase Authentication and Firestore. `scripts/service-worker.mjs` generates a versioned cache list after each build. The build is static and contains no server-side secrets.
