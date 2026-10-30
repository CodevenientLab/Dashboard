# Codevenient Workspace

A refreshed business app for PC and phone, built with React, Vite, JavaScript and Capacitor.

```sh
npm ci
npm run dev
```

Read **SETUP.md** for installation, Android APK build instructions and backups, and **FIREBASE-SETUP.md** to configure sign-in and Firestore access. The Android app uses the same Firebase workspace as the PC.

## Business health and client agreements

Overview now highlights late projects, overdue invoices and urgent tasks. Monthly reporting uses actual invoice payment dates and expense dates, compares with the previous month, and flags paid invoices with missing dates. Edit those invoices to record their actual payment dates. Collected less expenses is recorded activity, not a reconciled bank balance or accounting profit.

In **Documents → New contract**, choose **Client — Services & Terms of Agreement** (the default). Complete the legal names, notice emails, scope, exclusions, fees and review terms; preview, then generate a draft PDF. The saved document can be reopened and downloaded from Documents. Generating a draft does not sign it. Have a South African attorney review the template for your services and client type before first use. It preserves mandatory rights and does not automatically forfeit deposits.

Legal references used for the new client template: [Consumer Protection Act](https://www.gov.za/documents/consumer-protection-act) and [Protection of Personal Information Act](https://www.justice.gov.za/legislation/acts/2013-004.pdf). A project-specific data-processing agreement may still be needed.

## Verification

`npm test`, `npm run lint`, and `npm run build` cover the model, sync, reporting and production bundle. The reporting/payment/contract browser regression uses mock Firebase and never needs live client records:

```sh
npx vite build --config vite.test.config.js
node tests/browser/health.cjs
```

The browser regression requires Playwright and a Chromium browser. Optional environment variables: `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `UI_TEST_DIST`, and `TEST_OUTPUT_DIR`. Screenshots and a sample agreement PDF go to the test output directory (a temporary directory by default).
