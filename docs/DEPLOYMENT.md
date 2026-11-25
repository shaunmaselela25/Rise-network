# RISE NETWORK — Deployment

> **Status:** Not deployed. Hosting provider not chosen (D-07). This document records the
> intended procedure. Last updated: 2026-11-25.

## 1. Environments (planned)

| Environment | Frontend                             | Supabase project             | Purpose                  |
| ----------- | ------------------------------------ | ---------------------------- | ------------------------ |
| Local       | `npm run dev` (Vite, :5173)          | Supabase CLI stack in Docker | Development              |
| Staging     | Host preview/staging site            | Separate Supabase project    | Pre-release verification |
| Production  | Host production site + custom domain | Separate Supabase project    | Live                     |

Environments never share databases or keys.

## 2. Configuration

| Variable                  | Exposed to browser     | Notes                                       |
| ------------------------- | ---------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`       | Yes                    | Per environment                             |
| `VITE_SUPABASE_ANON_KEY`  | Yes (public by design) | Per environment; access enforced by RLS     |
| Supabase service-role key | **Never**              | Operators/CI only, for migrations if needed |
| Database password         | **Never**              | Operators only                              |

## 3. Build

`npm ci && npm run build` → static files in `dist/`. The host must rewrite all unknown paths
to `/index.html` (SPA fallback) so deep links work.

## 4. Security headers

To be configured at the host once chosen:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';
  img-src 'self' data:; font-src 'self'; connect-src 'self' https://<project>.supabase.co;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

The CSP must be tested against the built app (Vite injects no inline scripts by default).

## 5. Database migrations (Phase 2+)

- Migrations live in `supabase/migrations/` and are the only way the schema changes.
- A migration file is **immutable once applied to staging or production**; fix mistakes with a
  new migration. Before any shared environment exists, unapplied migrations may be amended.
- Apply to staging first: `supabase db push` against the staging project, run smoke tests.
- Production: take/confirm a backup, apply, smoke test.
- **Rollback:** write forward-fix migrations; for destructive changes, restore from backup.
  Every destructive migration must document its rollback in the PR.

## 6. Backups and recovery (to be confirmed against the chosen Supabase plan)

Supabase plan determines daily backups / point-in-time recovery. A restore drill into staging
is a Phase 7 gate.

## 7. Release procedure

1. CI green on the release PR. 2. PO approval. 3. Merge to `main`. 4. Apply migrations to
   production. 5. Deploy frontend. 6. Run production smoke tests. 7. Record in CHANGELOG.

Production deployment requires explicit product-owner approval.
