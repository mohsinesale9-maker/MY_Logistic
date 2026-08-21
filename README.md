# MY Logistics — ERP

A complete logistics / supply-chain ERP: transport, fleet, fuel, warehouse,
stock, finance, CRM, HR, maintenance, production, BI, reports. Built with
**Vite + React 18 + Tailwind + Radix UI** and backed by **Supabase**.

## Prerequisites

1. Node 18+.
2. (Optional) a Supabase project — without it the app runs in offline mode
   using your browser's `localStorage`, which is great for development.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). You'll land on
`/landing`, then `/login` accepts any email + password while offline (it signs
you in as a demo admin). With real Supabase configured, use a real account
created in **Authentication → Users**.

## Configuring Supabase

1. Create a new Supabase project.
2. In the SQL editor, paste and run `supabase/schema.sql` (creates the 32
   tables, RLS policies, and indexes).
3. Copy `.env.example` to `.env.local` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_SUPABASE_SERVICE_KEY=eyJ...        # optional, server-side only
   VITE_OPENAI_API_KEY=sk-...              # optional, for AI features
   ```
4. Restart `npm run dev`. The badge in the sidebar will read "Supabase" once
   the client is configured.

## Architecture

```
src/
├── api/                 # Backend adapters
│   ├── index.js         # central exports (entities, auth, integrations, …)
│   ├── supabaseClient.js
│   ├── entities.js
│   ├── auth.js
│   ├── functions.js
│   ├── integrations.js
│   └── offlineStore.js
├── lib/                 # Cross-cutting helpers
│   ├── AuthContext.jsx
│   ├── report-export.js # PDF + Word reports with department signatures
│   ├── logistics-math.js
│   └── …
├── pages/               # 60+ routed pages
├── components/          # UI primitives + erp/ shared widgets
├── hooks/               # useEntity, usePermissions, useCompanySettings, …
└── …
supabase/
└── schema.sql           # full DDL, run once on your project
```

### Entity mapping

Entity names in code (camelCase) map to table names (snake_case). Most
entities are simply lowercased (`Article` → `article`). The exceptions —
renamed to avoid Postgres reserved words — are:

| Code              | Table                  |
| ----------------- | ---------------------- |
| `User`            | `app_user`             |
| `UserPermission`  | `app_user_permission`  |
| `CompanySetting`  | `app_company_setting`  |

### Auth flow

`AuthContext` reads the active Supabase session on mount, then hydrates the
`app_user` row (auto-creates one for new emails). Login uses
`signInWithPassword`; registration uses `signUp` + `verifyOtp`; password
reset uses the recovery email flow.

### Offline mode

When `VITE_SUPABASE_URL` is empty, `supabaseClient` is replaced by an
in-memory adapter backed by `localStorage`. Every page, form, list, and
report still works — the data just stays in your browser.

## Available scripts

| Command          | Description                                |
| ---------------- | ------------------------------------------ |
| `npm run dev`    | Vite dev server                            |
| `npm run build`  | Production build to `dist/`                |
| `npm run preview`| Preview the production build               |
| `npm run lint`   | ESLint check                               |
| `npm run lint:fix` | Auto-fix lint errors                     |

## AI features

The Assistant IA, BI forecasts, and PDF/Word report predictions call
`integrations.Core.InvokeLLM`. To enable them, set `VITE_OPENAI_API_KEY` in
`.env.local`. Without a key, the AI features show a clear message instead of
throwing.

## License

Proprietary — MY Logistics.
"# MY_Logistic" 
