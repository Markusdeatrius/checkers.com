# checkers.com

A multiplayer checkers web app with real-time gameplay, matchmaking, player stats, and an ELO-based leaderboard.

This repository contains a Nuxt 4 frontend, an Express + Socket.IO backend, PostgreSQL with Prisma, and a Caddy reverse proxy.

## Features

- Real-time checkers matches via Socket.IO
- Matchmaking lobby with waiting games
- Player authentication (register/login)
- Match history and leaderboard
- ELO rating updates after each match
- Docker Compose deployment with PostgreSQL and Caddy

## Architecture

- `app/web` — Nuxt 4 frontend (Vue 3)
- `app/server` — Express backend with Socket.IO, Prisma, and PostgreSQL
- `app/caddy` — Caddy reverse proxy routing API and frontend traffic
- `docker-compose.yml` — local service orchestration

## Tech stack

- Nuxt 4 / Vue 3
- Express 5
- Socket.IO
- PostgreSQL
- Prisma
- TypeScript
- Caddy
- Docker / Docker Compose

## Prerequisites

- Docker
- Docker Compose
- Node.js / npm (for local development without Docker)

## Quick start with Docker

1. Rename the example env file to `.env`:

```bash
mv ./.env\ example .env
```

2. Start the full stack:

```bash
docker compose up --build
```

3. Open the app in your browser:

```text
http://localhost
```

## Local development

### Backend

```bash
cd app/server
npm install
npm run up
```

The backend listens on port `3002` and exposes:

- `/api/auth`
- `/api/games`
- `/api/user`
- `/api/matches`
- Socket.IO on `/socket.io`

### Frontend

```bash
cd app/web
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Database setup

From `app/server`:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Folder overview

- `app/caddy` — Caddy configuration and Dockerfile
- `app/server` — backend source, Prisma schema, migrations, and Dockerfile
- `app/web` — Nuxt frontend and client code

## Notes

- Caddy proxies `/api/*` and `/socket.io/*` to the backend and all other requests to the frontend.
- The backend initializes a pool of waiting games on startup.
- JWT authentication is used for secure API access.

## License

This project is licensed under the terms in `LICENSE`.
