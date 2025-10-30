# My Notes Service (Express + Sequelize + Redis)

Backend API for a notes application with authentication, email verification, password resets, and Redis‑backed rate limiting. Built with Express, Sequelize (PostgreSQL), Redis, and Resend.

## Overview

- Auth with HTTP‑only cookies and automatic access/refresh rotation
- Notes CRUD with HTML sanitization and lightweight Redis caching
- Email verification and password reset via Resend
- Robust rate limiting using Redis with safe in‑memory fallback
- Health endpoint at `/api/health` for Render health checks and uptime monitors (includes status, DB/Redis state, latency, and time)
- Production‑ready Postgres config with SSL (suitable for Supabase)
- Strict request validation on every route using `express-validator`
- Comprehensive tests (unit + integration) with Jest + Supertest using in‑memory SQLite

## Tech Stack

- Express, express‑validator, cookie‑parser, CORS
- Sequelize + PostgreSQL (production) / SQLite (tests, in‑memory)
- Redis (`redis`, `rate-limit-redis`, `express-rate-limit`)
- Resend (transactional email)
- Testing: Jest + Supertest with SQLite in‑memory
- Node `20.19.1`

## Project Structure

- `app.js`: Express app, CORS, cookies, parsers, `/api/health`, route mounting
- `routes/*`: `auth`, `notes`, `user`
- `controllers/*`: request handlers and DB transactions
- `middleware/auth.js`: JWT validation and rotation using cookies
- `models/*`: Sequelize models and associations
- `config/database.js`: Postgres connection (SSL in production) + tuned pool
- `config/redis.js`: Redis client with fast‑fail, reconnect logs, and readiness helper
- `utils/cache.js`: Safe Redis JSON get/set/del with command timeouts
- `utils/rate-limiter.js`: RedisStore limiter with in‑memory fallback when Redis offline

## API Summary

- Auth (`/api/auth`)
  - `PUT /register`
  - `POST /login`
  - `GET /verify/:token`
  - `POST /resend-verification` (rate‑limited)
  - `POST /forgot-password` (rate‑limited)
  - `POST /reset-password/:token`
  - `POST /logout`
  - `GET /check-auth-session`
- Notes (`/api/notes`, auth required)
  - `GET /` list
  - `POST /` create
  - `GET /:id` read
  - `PUT /:id` update
  - `DELETE /:id` delete
- User (`/api/user`, auth required)
  - `GET /profile`
  - `PUT /profile`
  - `DELETE /`
- Health
  - `GET /api/health` returns `{ status: ok|degraded, db, redis, latencyMs }`

## API Reference

- Auth

  - `PUT /api/auth/register`
    - Body: `{ email, password, username, fullname }`
    - 201: `{ message, code: 201 }`
    - Errors: 409/422 on validation, 500 on server
  - `POST /api/auth/login`
    - Body: `{ email, password }`
    - 200: `{ message, code: 200 }` and sets `access_token`, `refresh_token` cookies
    - Errors: 401 invalid credentials or unverified email, 422 on validation
  - `POST /api/auth/logout`
    - 200: `{ message, code: 200 }` and clears auth cookies
  - `GET /api/auth/check-auth-session`
    - 200: `{ message, headers, cookies }`
  - `GET /api/auth/verify/:token`
    - 200: `{ message, code: 200 }`
    - Errors: 401 invalid/expired token, 409 already verified
  - `POST /api/auth/resend-verification`
    - Body: `{ token }` (previous verification token)
    - 200: `{ message, code: 200 }`
  - `POST /api/auth/forgot-password`
    - Body: `{ email }`
    - 200: `{ message, code: 200 }`
    - Errors: 422 if email not found
  - `POST /api/auth/reset-password/:token`
    - Body: `{ password }`
    - 200: `{ message, code: 200 }`
    - Errors: 401 invalid/expired token

- Notes (auth required)

  - `GET /api/notes`
    - 200: `{ message, data: Note[], code: 200 }`
  - `POST /api/notes`
    - Body: `{ title, description }`
    - 201: `{ message, data: Note, code: 201 }`
  - `GET /api/notes/:id`
    - 200: `{ message, data: Note, code: 200 }`
    - Errors: 404 if not found
  - `PUT /api/notes/:id`
    - Body: `{ title, description }`
    - 201: `{ message, data: Note, code: 201 }`
  - `DELETE /api/notes/:id`
    - 200: `{ message, code: 200 }`

- User (auth required)

  - `GET /api/user/profile`
    - 200: `{ message, data: { username, email, fullname, isVerified }, code: 200 }`
  - `PUT /api/user/profile`
    - Body: `{ username, email, fullname }`
    - 201: `{ message, data: { username, email, fullname }, code: 201 }`
    - Note: resets `isVerified` when email changes
  - `DELETE /api/user`
    - 200: `{ message, code: 200 }`

- Health
  - `GET /api/health`
    - 200: `{ status: 'ok'|'degraded', db: 'ok'|'error', redis: 'ok'|'error', latencyMs }`

Note shapes

- `Note`: `{ id, title, description, raw_description, createdAt, updatedAt }`
- Error responses: `{ success: false, message, data }` with status `401|404|409|422|500`

## Environment Variables

Create `.env` from `.env.example` and fill values. Key groups:

- App: `NODE_ENV`, `HOST`, `PORT`, `CORS_ORIGIN`
- DB: `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_HOST`, `DB_DIALECT`, `DB_PORT`
- DB pool tuning: `DB_POOL_MIN` (default `1`), `DB_POOL_MAX` (default `10`), `DB_POOL_ACQUIRE` (default `10000` ms), `DB_POOL_IDLE` (default `300000` ms)
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Email links: `VERIFY_URL`, `RESET_URL`
- Redis: `REDIS_SOCKET_HOST`, `REDIS_SOCKET_PORT`, `REDIS_USERNAME` (optional), `REDIS_PASSWORD`
- Redis tuning: `REDIS_CONNECT_TIMEOUT_MS` (default `5000` ms), `REDIS_COMMAND_TIMEOUT_MS` (default `2000` ms), `REDIS_READY_TIMEOUT_MS` (optional)

Note: Periodic DB/Redis keep‑alive intervals were removed. Prefer platform health checks hitting `/api/health` and “Always On” hosting to avoid cold starts.

## Quickstart (Local)

```bash
npm install
cp .env.example .env
# Fill in .env values
npx sequelize-cli db:migrate
npm run serve:dev
```

Dev uses `sequelize.sync()`; production uses `authenticate()` + migrations.

## Database (Migrations)

- Run migrations:

```bash
npx sequelize-cli db:migrate
```

- Generate a new migration:

```bash
npx sequelize-cli migration:generate --name <your-migration-name>
```

## Deployment

### Render (API)

- Create a Web Service, connect your repo
- Start command: `npm run serve:prod`
- Health Check Path: `/api/health`
- Set environment variables from `.env`
- Recommended: paid plan for “Always On”; free tier may sleep on idle

### Supabase (Postgres)

- Use supplied SSL CA (enabled by default in production)
- Run migrations against Supabase:

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

### Vercel (Frontend)

- Set `CORS_ORIGIN` in the API to your Vercel domain
- Ensure HTTPS on both API and frontend; send requests with `withCredentials: true`

## CORS and Cookies

- CORS is configured with `credentials: true` and `origin: process.env.CORS_ORIGIN`
- Cookies use `httpOnly`, `secure` in production, and `sameSite: 'none'`

## Rate Limiting & Redis

- Sensitive auth routes use `express-rate-limit` + `rate-limit-redis`
- If Redis is offline at startup, the limiter falls back to in‑memory (no crash)
- Cache utilities skip Redis when not ready and time out commands quickly
- Redis client logs connection state: connect, ready, reconnecting, end

## Troubleshooting

- 30s delay on first request after idle
  - DB pool cold start: set `DB_POOL_MIN=1` and `DB_POOL_ACQUIRE=10000`
  - Platform cold start (free tiers): enable “Always On” or ping `/api/health` periodically
- Redis `ClientOfflineError`
  - Expected during boot if Redis not yet connected; limiter falls back to memory
  - Check logs for “Redis reconnecting…” and “Redis client ready”
- Cookies not set
  - Use HTTPS and set `CORS_ORIGIN` to the exact frontend origin
  - Frontend must send requests with `withCredentials: true`

## Production

- Apply migrations before start:

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

- Start:

```bash
npm run serve:prod
```

## Security & Auth

- Access and refresh tokens in HTTP‑only cookies; rotation handled in middleware
- Email verification and reset tokens are short‑lived and validated server‑side
- Rich HTML content is sanitized before storage
