# AGENTS.md

## Project Context

MY Logistics — a single-tenant ERP for logistics operations (transport, fleet,
fuel, warehouse, finance, CRM, HR, maintenance, production, BI, reports).
This repository is a Vite + React 18 SPA built on Radix UI / Tailwind and talks
to **Supabase** for auth + database + storage. The previous Base44 backend was
removed in favor of Supabase.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                  # frontend only
```

If you skip the Supabase config the app still runs in **offline mode**: data is
persisted in `localStorage` and the user is signed in as a demo admin. This
lets you exercise every page and CRUD flow without provisioning anything.

## Supabase Reference

- The full DDL lives in `supabase/schema.sql` (32 tables + RLS + indexes).
  Run it once in the Supabase SQL editor.
- The browser client lives in `src/api/supabaseClient.js`. It exports
  `supabaseClient` and `isSupabaseConfigured`.
- Entity adapters live in `src/api/entities.js` — they map camelCase entity
  names (e.g. `User` → `app_user`, `Article` → `article`) onto Supabase tables
  and expose the same `list / create / update / delete / bulkCreate / schema`
  API the rest of the app expects.
- Auth wrappers live in `src/api/auth.js` (`auth.me / loginViaEmailPassword /
  register / verifyOtp / resetPasswordRequest / resetPassword`).
- Integrations (file upload, CSV / Excel parsing, LLM calls) live in
  `src/api/integrations.js`. `InvokeLLM` is a no-op unless
  `VITE_OPENAI_API_KEY` is set; otherwise it routes to OpenAI directly.
- Edge functions (syncSupabase etc.) go through `src/api/functions.js`. Deploy
  them under the same name in your Supabase project.

## Key Files

- `src/api/index.js` — central exports (`entities`, `auth`, `integrations`, `functions`).
- `src/api/supabaseClient.js` — browser Supabase client (or offline fallback).
- `src/lib/AuthContext.jsx` — auth provider, uses `auth.me()`.
- `src/hooks/useEntity.js` — `useEntity(name)` returns `{ items, create, update, remove, reload }`.
- `src/components/erp/CrudPage.jsx` — generic CRUD page used by most modules.
- `src/lib/report-export.js` — PDF + Word export with department signatures.
- `vite.config.js` — Vite + React plugin only. No Base44 plugin.
- `supabase/schema.sql` — full DDL, run once on your Supabase project.

## Working Notes

- Default dev command is `npm run dev` (Vite). The build/lint scripts are
  `npm run build` and `npm run lint`.
- The app works in **offline mode** (localStorage-backed) when Supabase env
  vars are absent. To switch to real Supabase, set the env vars and reload.
- For large file uploads you should swap the data-URL upload in
  `src/api/integrations.js` for a Supabase Storage bucket call.
- The LLM call in `InvokeLLM` should ideally hit a Supabase Edge Function
  that holds the OpenAI key server-side. The current direct-to-OpenAI path
  is only safe for local development.
- AI features (Assistant IA, BI forecasts, stock predictions) require
  `VITE_OPENAI_API_KEY`. Without it they return a clear placeholder instead
  of throwing.
