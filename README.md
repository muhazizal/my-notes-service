# My Notes Service (Express + Sequelize)

Backend API for a notes application with authentication, sessions, email verification, password resets, and Redis rate limiting.

## Prerequisites

- Node `20.19.1`
- PostgreSQL
- Redis
- Resend account for transactional email

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and fill in values.

## Environment Variables

See `.env.example` for all required vars:

- App: `NODE_ENV`, `HOST`, `PORT`
- DB: `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_HOST`, `DB_DIALECT`, `DB_PORT`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Redis: `REDIS_SOCKET_HOST`, `REDIS_SOCKET_PORT`, `REDIS_USERNAME` (optional), `REDIS_PASSWORD`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Email links: `VERIFY_URL`, `RESET_URL`

## Database (Migrations)

- Initialize and migrate:

```bash
npx sequelize-cli db:migrate
```

- Generate a new migration:

```bash
npx sequelize-cli migration:generate --name <your-migration-name>
```

## Development

```bash
npm run serve:dev
```

In development, the app uses `sequelize.sync()` to update tables quickly.

## Deployment

### Overview

- Use Supabase for Postgres and host the Node server on Render or Railway.
- Production uses `sequelize.authenticate()` and relies on migrations (no `sync`).
- SSL is enabled in production via `config/database.js` using the provided CA certificate.

### Prerequisites

- Supabase project created; note DB connection (host, port, database, user, password).
- Hosting account (Render or Railway).
- Frontend URLs for email links (`VERIFY_URL`, `RESET_URL`).
- Optional Redis provider (e.g., Upstash) for rate limiting.

### Environment Variables

Create `.env` from `.env.example` and fill in production values:

```bash
cp .env.example .env
```

Key variables:

- App: `NODE_ENV=production`, `HOST`, `PORT`
- DB (Supabase): `DB_HOST`, `DB_PORT=5432`, `DB_DATABASE=postgres`, `DB_USERNAME=postgres`, `DB_PASSWORD`, `DB_DIALECT=postgres`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Email links: `VERIFY_URL`, `RESET_URL`
- Redis (optional): `REDIS_SOCKET_HOST`, `REDIS_SOCKET_PORT`, `REDIS_USERNAME` (optional), `REDIS_PASSWORD`

### Migrate Database (Supabase)

Run migrations against Supabase:

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

Verify DB connectivity:

```bash
NODE_ENV=production node -e "require('./config/database').authenticate().then(()=>console.log('DB OK')).catch(e=>{console.error(e);process.exit(1)})"
```

### Deploy on Render (Recommended)

- Push repo to GitHub.
- In Render, create a new Web Service and connect the repo.
- Set environment variables from `.env`.
- Build runs automatically; Start command:

```bash
npm run serve:prod
```

- Ensure service has HTTPS so cookies are sent securely.

### Deploy on Railway (Alternative)

- Create a new service, connect the repo.
- Add env variables from `.env`.
- Start command:

```bash
npm run serve:prod
```

### CORS and Cookies

- CORS is configured in `app.js` with `credentials: true`. Set `origin` to your frontend domain in production.
- Ensure frontend uses `withCredentials=true` so cookies are sent.

### Email Links

- `VERIFY_URL` should point to your frontend verification page.
- `RESET_URL` should point to your frontend password reset page.

### Rate Limiter (Temporary Disable)

During deployment, you can temporarily disable rate limiting by removing `emailBlastLimiter` and `tokenBlastLimiter` middleware from `routes/auth.js`. Re-enable them once production is stable.

### Post-Deploy Checks

- Hit `/api/auth/check-auth-session` after login to confirm cookie/session is present.
- Test email flows (verify/reset) against production frontend URLs.
- Confirm DB writes/read via `/api/notes` endpoints.

### Troubleshooting

- If Sequelize fails to connect, confirm:
  - Supabase credentials.
  - Migrations ran successfully.
- For cookie issues across domains:
  - Use HTTPS.
  - Ensure CORS `origin` is your frontend URL and `credentials: true` is set.

## Production

- Apply migrations before starting the server:

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

- Start:

```bash
npm run serve:prod
```

## API Overview

- Auth: `/api/auth/*` (register, login, verify, resend-verification, forgot-password, reset-password, logout)
- Notes: `/api/notes/*` (CRUD, requires auth)
- User: `/api/user/*` (profile, update, delete, requires auth)

## Security & Auth
- Cookies: `access_token` and `refresh_token` are `httpOnly`. In production, they use `secure: true` and `sameSite: 'none'` so cross-site requests work with modern browsers.
- Frontend domain: `https://mn-muhazizal.vercel.app` — set CORS `origin` in `app.js` to this exact URL and keep `credentials: true`. On the frontend, send requests with `withCredentials: true` so cookies are included.
- HTTPS: When using `sameSite: 'none'`, browsers require HTTPS for both the frontend and the API; otherwise cookies won’t be set.
- Optional cookie domain: set `COOKIE_DOMAIN` only when the API and frontend share a parent domain (subdomains, e.g., `api.example.com` and `app.example.com`). It does not enable cookies across unrelated domains (e.g., a Vercel app and a different host).
- JWT rotation: Access token expires in `1h`, refresh token in `1d`. When the access token is expired, `authMiddleware` verifies the refresh token and rotates both tokens. If the refresh token is expired or invalid, cookies are cleared and the request returns `401 Unauthorized`.
- Email tokens: Verification and reset-password tokens are 64‑char hex strings that expire in 10 minutes (`generateToken`), stored as BIGINT timestamps for reliable expiry checks.
- JWT rotation handled server-side.
- Rich text is sanitized before storing.
- Redis-backed rate limiting for sensitive endpoints.
