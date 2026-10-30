# Firebase and GitHub Pages setup

GitHub Pages serves the frontend publicly. Company records are loaded only after Firebase Authentication succeeds and Firestore rules approve the signed-in account. The app does not include a screen-blurring privacy toggle; use device security and sign out on shared devices.

## Firebase project

1. Create a Firebase project and register a Web app.
2. In Authentication, enable Email/Password sign-in. Disable public account creation if this workspace is for a closed group; create accounts for intended users in the Firebase console.
3. Create a Firestore database.
4. Publish the rules from `firebase/firestore.rules`. They deny access by default and allow a user to read or update only their own workspace when a matching `approvedUsers/{uid}` document exists. Create an empty document for each approved user's Firebase Authentication UID in `approvedUsers`; do not grant client write access to this collection.
5. Add `localhost` for the Android Capacitor WebView and local development. Add the GitHub Pages hostname (for example, `codevenientlab.github.io`) and any custom domain if you use Pages.

The Firebase web-app values are public client configuration, not admin credentials. Never place service-account keys or other privileged secrets in frontend code or `VITE_` variables.

## GitHub Pages

Add these **repository Actions variables** under Settings → Secrets and variables → Actions → Variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

The Pages workflow's build checks for these variables. Set the repository's Pages source to **GitHub Actions**, then run the selected deployment workflow. Confirm a permitted user can sign in and an unapproved user cannot load workspace records.

The `pages.yml` workflow runs tests and lint, checks that all Firebase variables are present, builds the app, and deploys it to Pages on pushes to `main` or a manual run. Configure the Pages source as **GitHub Actions** before the first deployment.

The build now falls back to the four public web-app identifiers in `.env.production` when repository variables are empty. Non-empty repository variables take precedence. The configuration check exports the checked values to subsequent CI steps. Never add an admin key or service-account credential to this file.

## Production domain: dash.codevenient.co.za

1. In Cloudflare DNS for `codevenient.co.za`, add `CNAME` name `dash`, target `codevenientlab.github.io`, TTL Auto, **DNS only** (grey cloud).
2. In this repository's **Settings → Pages**, select **GitHub Actions** as source. Set **Custom domain** to `dash.codevenient.co.za` and save. Once DNS and the certificate are ready, enable **Enforce HTTPS**. GitHub Actions deployments do not configure a custom domain from a CNAME file.
3. In Firebase Authentication settings, add `dash.codevenient.co.za` to **Authorized domains**, retaining the existing domains. If the Firebase web API key has website restrictions, also allow `https://dash.codevenient.co.za/*` in its existing restrictions.
4. Visit the HTTPS URL and confirm an approved account can sign in. Keep existing Firestore rules and account approvals in place; deployment does not change access to company records.

## Android APK

The Android app bundles the same Vite frontend and uses the same Firebase project and Firestore rules. Add `localhost` to Firebase Authentication's authorized domains. To build the APK on the development PC, follow the Android steps in `SETUP.md`; use the same approved account on PC and phone. Do not add Firebase service-account credentials to the Android app.

## Security and verification

Firebase Authentication and Firestore rules are the access boundary for company records. Test them with both approved and unapproved accounts before using real company data. Sign out on shared devices.
