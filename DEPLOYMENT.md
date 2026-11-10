# Publish from GitHub without installing Node on your computer

The workflow `.github/workflows/deploy-firebase.yml` tests, builds and deploys this website whenever `main` changes. Node runs on GitHub's servers. It can also be started manually from the repository's Actions tab. Firebase Hosting and Firestore rules deploy to **grant-df598**. Rules deploy first; a failed rules deployment prevents publishing the website.

## One-time Google authorization
This requires a Google account allowed to manage IAM permissions and create service account keys for project grant-df598. If organization policy disables keys, do not bypass it; use a Google administrator to configure Workload Identity Federation instead.

1. Open https://console.cloud.google.com/iam-admin/serviceaccounts?project=grant-df598 and select **Create service account**. Name it **github-grantwise-deploy**.
2. Give that dedicated account these project roles: **Firebase Hosting Admin**, **Firebase Rules Admin**, **Firebase Viewer**, and **Service Usage Consumer**. Do not grant Owner or Editor. These roles let it publish this site's files and Firestore rules and read Firebase project metadata. They do not enable email/password login or create the Firestore database.
3. Open the new account, choose **Keys → Add key → Create new key → JSON**, and download the key to your own computer. This is a private credential; do not commit it or paste it into chat.
4. Open https://github.com/AParr850/Final-Project/settings/secrets/actions and select **New repository secret**.
5. Name it exactly `FIREBASE_SERVICE_ACCOUNT_GRANT_DF598`. Paste the complete contents of the downloaded JSON key into its **Secret** field and save it. Keep the downloaded key secure, remove unnecessary local copies, and revoke/rotate it in Google Cloud if exposed. The Firebase browser API key in firebase-config.json is not this credential.

## Firebase prerequisites
- In https://console.firebase.google.com/project/grant-df598/authentication/providers enable **Email/Password**.
- In https://console.firebase.google.com/project/grant-df598/firestore create the default Firestore database in production mode if absent.
- In Firebase Hosting, click **Get started** if the default hosting site has not been initialized. The workflow replaces the live site's files on each successful deployment.
- In Authentication → Settings → Authorized domains, ensure `grant-df598.web.app` and `grant-df598.firebaseapp.com` are authorized.

## First deployment
Open https://github.com/AParr850/Final-Project/actions, select **Deploy website to Firebase**, then **Run workflow → main → Run workflow**. If GitHub displays **Enable workflows**, enable them first. Wait for a green checkmark. If a run triggered before the secret was added, rerun it after adding the secret.

After a successful deployment, open https://grant-df598.web.app. Test account creation, login, saving a nonprofit profile, adding an assessment, signing out, and signing back in. A second account should have its own empty workspace. No live deployment has been verified until the workflow succeeds and these checks pass.

Future commits to `main` automatically test and publish both the website and Firestore rules. Review rule changes carefully. An Actions failure can be inspected by opening the failed step. If Google reports insufficient permission, grant only the reported required permission to the dedicated account; do not broaden it to Owner.
