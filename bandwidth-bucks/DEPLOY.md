Netlify Deploy Steps

1) Required environment variables

- `FIREBASE_SERVICE_ACCOUNT` (recommended): JSON string of a Firebase service account. Use this for secure server-side Firestore via `firebase-admin`.
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- Email provider keys (e.g., `SENDGRID_API_KEY` or `RESEND_API_KEY`)
- Any other keys from `.env.local` used in the app

Notes:
- Put the full service account JSON as a single environment variable value (Netlify UI allows multiline). Example variable name `FIREBASE_SERVICE_ACCOUNT` or `NETLIFY_FIREBASE_SERVICE_ACCOUNT`.
- Client-side Firebase config must be available as `NEXT_PUBLIC_*` env vars.

2) Netlify config (done)
- `netlify.toml` is added and uses `@netlify/plugin-nextjs`.
- Build command: `npm run build`
- Publish directory: `.next`

3) Deploy preview & production
- Push branch to the repo connected to Netlify. Netlify will run the build using the plugin which handles Next.js functions and routing.
- If you used `FIREBASE_SERVICE_ACCOUNT`, server functions and API routes will use `firebase-admin` and access Firestore securely.

4) Troubleshooting
- If you see `Firebase: Need to provide options` in Netlify build logs, ensure either:
  - `FIREBASE_SERVICE_ACCOUNT` is set, or
  - All `NEXT_PUBLIC_FIREBASE_*` variables are set so the client SDK can initialize during pre-rendering.
- For production server logic, prefer `FIREBASE_SERVICE_ACCOUNT` and `firebase-admin` rather than relying on client SDK.

5) Quick local checks

Build locally (PowerShell):

```powershell
Set-Location 'Bandwidth bucks'
npm run build
```

Run locally (production server):

```powershell
Set-Location 'Bandwidth bucks'
# provide env vars locally using .env.local or your shell
npm run start
```

6) Next recommended steps
- Migrate KYC uploads to Firebase Storage (avoid storing DataURLs in Firestore).
- Verify Firestore rules and billing plan.
- Add end-to-end test script for signup → payout → admin approve/reject.

If you want, I can now:
- Add migration for KYC → Firebase Storage, or
- Wire `firebase-admin` usage into all server modules (already supported via `FIREBASE_SERVICE_ACCOUNT`), or
- Create a small `netlify-deploy.sh` script for CLI deploys.
