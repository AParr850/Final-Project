# Grantwise
A nonprofit grant decision dashboard with Firebase email/password accounts, private nonprofit profiles, and per-account grant assessments. Guests can explore sample data; creating or saving assessments requires login. Existing browser-only assessments are not automatically uploaded into an account.

## Run locally
Use Node.js 24, run `npm ci`, then `npm start`. Open port 3000 on the machine running the app. `npm test` checks recommendation logic and account-specific dashboard behavior.

Without Firebase configuration, the dashboard runs in demonstration mode and account services clearly report they are not connected. Real login, cloud persistence, and deployment require the setup below.

## Connect the existing project grant-df598
The CLI project alias is set in `.firebaserc`. The code checks that its runtime configuration belongs to `grant-df598`.

1. Open https://console.firebase.google.com/project/grant-df598/settings/general and select **Add app → Web** (`</>`). Register a web app named **Grantwise**. Reuse an existing Grantwise web app if already registered.
2. For local development, copy that app's public `firebaseConfig` into `firebase-config.json`, using the example file. On Firebase Hosting, the app can also load configuration from `/__/firebase/init.json` automatically.
3. Open https://console.firebase.google.com/project/grant-df598/authentication/providers and enable **Email/Password** (the password provider, not only email-link sign-in).
4. Open https://console.firebase.google.com/project/grant-df598/firestore and create the default Firestore database if absent, using production mode.
5. On your computer, install the Firebase CLI (`npm install -g firebase-tools`), run `firebase login`, then from this codebase run `npm ci`, `npm run build`, and `firebase deploy --project grant-df598 --only firestore:rules,hosting`.
6. Add the deployed hostname in Authentication → Settings → Authorized domains if necessary. Test sign-up, login, profile save, grant save, logout, and a second account's isolation.

These console changes and deployment require project access. Binding the codebase and building assets do not register an app, enable a provider, create a database, or deploy rules. Those operations have not been completed by this session.

## General Firebase setup reference
1. Open https://console.firebase.google.com/ and choose **Create a project**. Name it, for example, Grantwise. Google Analytics is optional for this app.
2. In Project overview, choose the **Web** icon (`</>`) to register a web app. Name it Grantwise. Copy its `firebaseConfig` fields into a new `firebase-config.json` in this repository, using `firebase-config.example.json` as the format. Use valid JSON with quoted keys. This browser configuration is public; never put service-account keys or private credentials in it.
3. Open **Build → Authentication → Get started → Sign-in method**. Enable **Email/Password**. In Authentication settings, add your website hostname to **Authorized domains**. Add `localhost` explicitly for local development if it is absent.
4. Open **Build → Firestore Database → Create database**. Select a suitable region and production mode. Keep default-deny protection until the provided rules are deployed.
5. Install the Firebase CLI with `npm install -g firebase-tools`, then run `firebase login` on your own computer and `firebase use --add` in this project directory to select your project. Do not share passwords or login tokens in chat.
6. Run `npm run build`. This copies only website files and the public Firebase configuration into `public/`.
7. Run `firebase deploy --only firestore:rules,hosting`. This deploys the private-access rules in `firestore.rules` and publishes the site. The CLI displays the public website URL. Do not enable database test mode or deploy the website with permissive rules.
8. Visit the published URL. Create an account, edit the nonprofit profile, create a grant assessment, sign out, then sign back in to confirm the records return. Use a second account to confirm it starts with an empty grant list and its own profile. Test password reset using an email you control.

## Data and access
Profiles are stored in `users/{Firebase Auth UID}` and assessments in `users/{UID}/grants/{grantId}`. Firestore rules restrict reads and writes to the authenticated owner. Separate accounts have separate workspaces; team invitations and shared organization access are not implemented. Passwords are handled by Firebase Authentication and never stored by the application. Firestore disk persistence is not enabled. The app clears displayed account data on sign-out or account change and reports failed saves without discarding the assessment form.

Recommendations estimate application effort and probability-weighted funding, excluding program delivery costs, matching funds and reporting. Demo opportunities are illustrative.

## Validation limits
Automated checks cover grant scoring, guest login gating, account transitions, and failed-save behavior. Live Firebase authentication, Firestore rule enforcement and cross-device persistence require a configured project and the manual acceptance checks above; these are not verified by a local demo.

## Automatic publishing from GitHub
See [DEPLOYMENT.md](DEPLOYMENT.md) for the one-time Firebase authorization and GitHub Actions setup. No local Node installation is needed. After the repository secret is configured, pushes to `main` publish Hosting and Firestore rules automatically.
