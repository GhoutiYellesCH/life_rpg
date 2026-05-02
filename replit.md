# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Authentication

Session-based auth via `express-session`. Two hardcoded users:

| Username | Default Password | Role |
|----------|-----------------|------|
| `hero`   | `hero123`       | user |
| `admin`  | `admin123`      | admin |

Override passwords with env vars `USER_PASSWORD` and `ADMIN_PASSWORD`.

- **Session secret**: `SESSION_SECRET` env var (required)
- **Auth routes**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Protected routes**: All `/api/*` routes except `/api/healthz` and `/api/auth/*`
- **Admin routes**: `/api/admin/*` — requires admin role; gives full CRUD over all DB tables

## Life RPG App

8-page gamified life tracking app (Dashboard, Quests, Health, Finances, Shop, Inventory, GroupQuests, Profile + Admin panel).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
