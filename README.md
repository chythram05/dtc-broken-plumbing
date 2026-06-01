# dtc-broken-plumbing

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chythra-w1/broken-plumbing-template)

## What this template tests

**Category B: Plumbing bugs.** Auto-provisioning of resources half-works. The form submits cleanly, the user thinks everything is fine, then the build/deploy step explodes.

## Where each failure occurs in the deploy flow

The Deploy to Cloudflare flow has roughly six steps:

1. **Click button** → land on `deploy.workers.cloudflare.com`.
2. **Auth** → sign in to Cloudflare and connect a Git provider.
3. **Configure form** → name Worker/repo, fill in resource and secret fields.
4. **Submit form** → Cloudflare validates the form.
5. **Clone + provision** → Cloudflare copies repo into your GitHub, creates resources.
6. **Build + deploy** → Workers Builds runs `npm install` + your `deploy` script.

| # | Bug | Fails at step |
|---|---|---|
| 1 | `wrangler.toml` used instead of `wrangler.jsonc`, so the auto-provisioned `database_id` is silently skipped on write-back | **Step 5** — provisioning succeeds but the config in the new repo is left without the ID. No warning. |
| 2 | `deploy` script runs `wrangler d1 migrations apply DB --remote` before `wrangler deploy`. The migrations subcommand can't resolve an auto-provisioned binding without a `database_id` | **Step 6** — build log shows: `Found a database with name or binding DB but it is missing a database_id, which is needed for operations on remote resources.` |

## Expected user experience

1. User clicks the button, signs in.
2. Form looks fine — no fields blocked, just standard Worker/repo naming.
3. User clicks Deploy.
4. Cloudflare clones repo, creates the D1 database (provisioning step succeeds).
5. Workers Builds runs `npm run deploy`, which runs migrations first.
6. **Build fails** with the "missing database_id" error.
7. If the user then clones the new repo locally and inspects `wrangler.toml`, the `database_id` is still missing — confirming the TOML write-back was silently skipped.

## What the template is supposed to do (if plumbing worked)

A tiny notes API backed by D1:
- `GET /notes` → list recent notes.
- `POST /notes` `{ content }` → insert a note.

The `0001_init.sql` migration creates the `notes` table at deploy time.

## Workarounds (for documentation purposes)

- Convert `wrangler.toml` → `wrangler.jsonc` so ID write-back works.
- Manually copy the auto-provisioned `database_id` from `wrangler d1 list` into the config before running migrations.

## Source citations

- D1 subcommands don't support auto-provisioned bindings + TOML write-back skipped: [workers-sdk#13632](https://github.com/cloudflare/workers-sdk/issues/13632)
- Cloudflare's own recommended pattern (migrations in deploy script): [Deploy to Cloudflare docs → Running D1 Migrations](https://developers.cloudflare.com/workers/platform/deploy-buttons/#best-practices)

## To reproduce

1. Push this folder to a new public GitHub repo.
2. Update the `REPLACE_ME` in the badge URL above.
3. Click the badge, sign in, click Deploy.
4. Watch the build log fail at the migrations step.
