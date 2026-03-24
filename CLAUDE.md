# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FirstCarAI is a NestJS REST API that helps users select cars they can realistically afford based on their financial situation. It uses Supabase (PostgreSQL) as the database.

## Commands

```bash
# Development
npm run start:dev       # Run with hot-reload
npm run start:debug     # Run in debug mode
npm run build           # Compile TypeScript to dist/
npm run start:prod      # Run compiled production build

# Testing
npm run test            # Run unit tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
npm run test:e2e        # End-to-end tests

# Code quality
npm run lint            # ESLint with auto-fix
```

Run a single test file: `npx jest src/modules/auth/auth.service.spec.ts`

## Architecture

**Framework:** NestJS with modular architecture. Port defaults to 3000 (override with `PORT` env var).

**Module Structure:**
- `src/app.module.ts` — Root module. Feature modules must be imported here to be active.
- `src/modules/auth/` — Authentication (controller + service stubs)
- `src/modules/supabase/` — Supabase client wrapper (`SupabaseService`), intended to be injected into other modules
- `src/modules/users/` — User CRUD (controller + service stubs)

**Current State:** The project is in early scaffolding. All feature modules exist but contain empty stubs. The root `AppModule` does not yet import the feature modules — they need to be wired in.

**Database Entities (defined in README, not yet implemented in code):**
- Users, Cars, Recommendations, Insurance Estimates, User Preferences, Scraping Jobs

## Environment Variables

Required in `.env`:
```
SUPABASE_URL=
SUPABASE_KEY=
```

## TypeScript Config Notes

- `noImplicitAny` is disabled — explicit `any` types are allowed
- `emitDecoratorMetadata` and `experimentalDecorators` are enabled (required for NestJS DI)
- Module resolution: `nodenext`
