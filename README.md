# SHAFARE
ALL TOOLS. ONE PLACE. — about 85 browser-based tools, accounts, and an admin console.

```
npm install
cp .env.example .env     # set SUPERADMIN_EMAILS to your email, plus SMTP_* / GOOGLE_CLIENT_ID if you have them
npm run dev:all          # web on :5173, API on :8787 (Vite proxies /api)
npm run dev              # frontend only (everything works locally, no accounts)
npm run build && npm start   # production: one Node process serves site + API
```
First admin: put your email in `SUPERADMIN_EMAILS`, register that email, verify it (with no SMTP the link prints in the server console), then open **/admin**.

## Structure
```
src/
  config.ts            brand + runtime flags
  ds/                  design system: Modal, Tabs, Dropdown/Popover, Toast, Table, Charts, Avatar, Badge, Switch, EmptyState...
  ui.tsx               base atoms used by every tool (Button, Panel, ResultCard, Editor, Dropzone...)
  api/                 data layer (client.ts = HTTP + token refresh, index.ts = typed calls + sync)
  state/               session (in memory), notifications, public content
  store.ts             local-first app data (persisted on device)
  features/            dashboard, auth, account, activity, notifications, splash, admin (SHAFARE ADMIN)
  tools/ registry.ts   the tools; add one with a single T(...) entry
server/
  config.js db.js      configuration (server only) and data layer (swap for Postgres later)
  security.js          headers/CSP, CORS, rate limiting, validation, audit log
  rbac.js middleware.js roles → permissions, authentication, permission guards
  routes/              auth.js, user.js, admin.js
```

## Security model (what is actually implemented)
- **Passwords:** bcrypt (cost 12), 10+ characters, common-password and email-name checks. Timing-safe login (dummy hash when the account doesn't exist).
- **Sessions:** 15-minute access token held in memory only; 30-day refresh token in an `httpOnly`, `SameSite=Strict`, `Secure` (production) cookie, **rotated on every use** and stored only as a hash. Replaying an old refresh token revokes that session and logs a critical event. Password change/reset signs out all devices. Users can see and revoke devices.
- **CSRF:** refresh/logout require a custom header plus an allowed Origin; all other endpoints use bearer tokens, not cookies.
- **Brute force:** per-IP rate limits (strict on auth routes) and per-account lockout after 5 failures with growing delays.
- **Headers:** CSP, HSTS (production), `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy; API responses are `no-store`.
- **Validation:** every endpoint whitelists and length-limits input; request bodies are size-capped; avatars are re-encoded in the browser and verified by file signature on the server.
- **Authorization:** role → permission map (`server/rbac.js`) enforced per route; admins can only manage accounts below their own role; superadmin comes only from the server env.
- **Audit log:** append-only `server/data/security.log` (JSONL) plus an in-app viewer: sign-ins, failures, lockouts, role changes, exports, blocked requests.
- **Secrets:** only in server env/files; the browser receives just the public Google client ID. CSV exports neutralise spreadsheet-formula injection.
- **Not included:** two-factor auth, encryption at rest for the data file, and IP reputation/WAF. Run behind HTTPS and put the data directory on an encrypted disk.

## Admin (SHAFARE ADMIN, /admin)
Separate shell and navigation. Roles: `user`, `analyst` (analytics, reports), `support` (read users, logs, analytics), `admin` (manage users, content, notifications), `superadmin` (everything incl. roles, settings, deleting users).
Pages: Overview, Analytics, Users, Content (announcements, featured and disabled tools), Reports (CSV), Notifications, Security logs, Settings (sign-ups, maintenance mode), Roles & access.

See `DEPLOY.md` for hosting as a website, installing as a web app, and building Android/iOS apps.
