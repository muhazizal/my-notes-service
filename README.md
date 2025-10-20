# My Notes Service (Express + Sequelize)

Backend API for a notes application with authentication, sessions, email verification, password resets, and Redis rate limiting.

## Prerequisites
- Node `20.19.1`
- PostgreSQL
- Redis
- Gmail account (or SMTP provider) for email

## Setup
```bash
npm install
```

Create `.env` from `.env.example` and fill in values.

## Environment Variables
See `.env.example` for all required vars:
- App: `NODE_ENV`, `APP_HOST`, `APP_PORT`
- DB: `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_HOST`, `DB_DIALECT`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Redis: `REDIS_SOCKET_HOST`, `REDIS_SOCKET_PORT`, `REDIS_PASSWORD`
- Email: `EMAIL_USER`, `EMAIL_PASSWORD` (use Gmail App Password), `VERIFY_URL`, `RESET_URL`

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
npm run dev
```
In development, the app uses `sequelize.sync()` to update tables quickly.

## Production
- Ensure all migrations are applied:
```bash
npx sequelize-cli db:migrate
```
- Start the server (no sync in production):
```bash
npm start
```

## API Overview
- Auth: `/api/auth/*` (register, login, verify, resend-verification, forgot-password, reset-password, logout)
- Notes: `/api/notes/*` (CRUD, requires auth)
- User: `/api/user/*` (profile, update, delete, requires auth)

## Security
- Sessions: `session_id` httpOnly cookie (secure in production)
- JWT rotation handled server-side
- Rich text is sanitized before storing
- Redis-backed rate limiting for sensitive endpoints
