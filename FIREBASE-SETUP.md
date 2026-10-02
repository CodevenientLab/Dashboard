# Firebase and GitHub Pages setup

GitHub Pages serves the frontend publicly. Company records are loaded only after Firebase Authentication succeeds and Firestore rules approve the signed-in account. The app does not include a screen-blurring privacy toggle; use device security and sign out on shared devices.

## Firebase project

1. Create a Firebase project and register a Web app.
2. In Authentication, enable Email/Password sign-in. Disable public account creation if this workspace is for a closed group; create accounts for intended users in the Firebase console.
3. Create a Firestore database.
4. Publish the rules from `firebase/firestore.rules`. They deny access by default and allow a user to read or update only their own workspace when a matching `approvedUsers/{uid}` document exists. Create an empty document for each approved user's Firebase Authentication UID in `approvedUsers`; do not grant client write access to this collection.
5. Add the GitHub Pages hostname (for example, `codevenientlab.github.io`) and any custom domain to Firebase Authentication's authorized domains.

The Firebase web-app values are public client configuration, not admin credentials. Never place service-account keys or other privileged secrets in frontend code or `VITE_` variables.

## GitHub Pages

Add these **repository Actions variables** under Settings → Secrets and variables → Actions → Variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

The Pages workflow's build checks for these variables. Set the repository's Pages source to **GitHub Actions**, then run the selected deployment workflow. Confirm a permitted user can sign in and an unapproved user cannot load workspace records.

The `pages.yml` workflow runs tests and lint, checks that all Firebase variables are present, builds the app, and deploys it to Pages on pushes to `main` or a manual run. Configure the Pages source as **GitHub Actions** before the first deployment.

## Security and verification

Firebase Authentication and Firestore rules are the access boundary for company records. Test them with both approved and unapproved accounts before using real company data. Sign out on shared devices.
