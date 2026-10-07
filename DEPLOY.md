# Using SHAFARE as a website, a web app, and an app

One codebase, three ways to ship it. Start with `npm install`.

## 1. Website
**Static (no accounts):** `npm run build`, then upload `dist/` to Netlify, Vercel, Cloudflare Pages or any static host. `netlify.toml` and `vercel.json` already handle page routing. Accounts and sync switch themselves off with a friendly message; every tool still works.

**Full (with accounts, email, Google sign-in):** run the included server, which also serves the site.
```
cp .env.example .env     # fill in APP_URL, SMTP_*, GOOGLE_CLIENT_ID
npm run build && npm start
```
Or with Docker: `docker build -t shafare . && docker run -p 8787:8787 -v shafare-data:/data --env-file .env shafare`.
Use HTTPS in production (required for the camera, installing, and Google sign-in).

## 2. Web app (installable)
SHAFARE is already a PWA. Once it is hosted on HTTPS:
- **Chrome / Edge / Android:** an **Install** button appears in the header (also under Settings), or use the browser menu, "Install app".
- **iPhone / iPad:** Share, then **Add to Home Screen**.
It then opens in its own window with the SHAFARE icon and works offline for the tools.

## 3. App (Android and iOS, from the same code)
Uses Capacitor. You need Android Studio for Android, or a Mac with Xcode for iOS.
```
npm run app:android:add     # one time: creates android/, adds camera permission, generates icons and splash
npm run app:android         # builds, syncs and opens Android Studio, then press Run or build an APK/AAB
npm run app:ios:add         # one time (Mac)
npm run app:ios
```
Notes:
- **Accounts in the app:** the app can't use relative `/api` calls. Before building, create `.env.production` with `VITE_API_URL=https://your-server.example.com`, and deploy the server there. Without it, the app works fully offline and local-only.
- **Google sign-in** is hidden inside the native app (email and password still work).
- **Downloads** (PDFs, images, exports) open the system share sheet inside the app.
- App id is `com.shafare.app` (change it in `capacitor.config.ts` before publishing). Icons come from `assets/`.
- To publish: Google Play needs a signed AAB and a developer account; the App Store needs an Apple developer account.

## Security notes for deployment
- Set `NODE_ENV=production`, serve over HTTPS, and set `TRUST_PROXY=1` when behind a proxy so rate limits use real client IPs.
- Set `SUPERADMIN_EMAILS` to your verified email to access `/admin`. Keep `server/data/` private and back it up; it contains the user database and audit log.
- Host the site and API on the same site (the included server does this). The refresh cookie is `SameSite=Strict`, so a frontend on a different domain from the API will not stay signed in; use the same registrable domain or the bundled server.
- The native app stores its refresh token in app storage (WebViews can't use these cookies cross-origin). Treat that as the trade-off for mobile.
