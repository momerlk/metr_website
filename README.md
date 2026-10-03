# Metr

Next.js App Router + React + TypeScript. Native CSS, local Satoshi, approved Metr brand assets, and a Metr Fit sizing demo backed by the Fit API. AI product search (Discover) is not part of the current site; `/discover` redirects to `/fit` and the old page lives in git history.

## Run

Requires Node 22.13+ (native SQLite).

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates the production build; `npm start` serves it. `npm test` checks form validation and demo constraints. `npm run check` runs TypeScript.

## Access requests

`POST /api/access` validates submissions and stores them in SQLite at `data/leads.sqlite`. It includes an origin check, body-size limit, honeypot, transactional rate limiting, and explicit error states. Set `LEADS_DB_PATH` to a persistent, private disk location. Do not deploy this storage configuration to an ephemeral/serverless filesystem; use a shared database for that deployment model. Back up the database and restrict filesystem access.

By default requests share a conservative rate limit (5/minute). Set `TRUST_PROXY=true` only when your trusted proxy strips incoming X-Forwarded-For headers and sets its own. Then limits are per hashed client IP. Leads are not emailed or sent to an external service.

## Live Fit demo

The Fit demo on `/` and `/fit` runs against a real Metr Fit deployment when `METR_API_URL`, `METR_STORE_ID` and `METR_API_KEY` are set. The browser only calls `/api/fit`; the key stays on the server. Use a store-scoped key limited to the `catalog` and `fit` scopes, pointed at a sample store, never a live merchant's customer data. The route applies the same origin check, body-size limit and rate limit as access requests, and forwards only the answer fields the questionnaire defines.

Without those variables the page falls back to the illustrative, prewritten demo. Set them before building, since both pages are prerendered.

## Before public launch

- Set `SITE_URL` to the verified domain for canonical URLs, social metadata, and sitemap.
- Review and approve Privacy/Terms, company naming, retention policy, and privacy contact. Current pages are explicitly provisional and noindexed.
- Configure persistent lead storage, backups, and an operational review process.
- Confirm integration availability; current connectors are accurately marked planned/in development.
- Analytics is intentionally not connected to an external provider; add the chosen first-party destination when approved.

## Assets

Brand originals live in `metr_assets`. Public logo copies are in `public/brand`. The supplied font is self-hosted for this website at `public/fonts/Satoshi-Variable.woff2`; font binaries are ignored by Git under the supplied license. On a fresh checkout, obtain Satoshi from Fontshare under its license and put the unchanged WOFF2 at that path. The site falls back to Helvetica if it is absent. Product drawings are original SVG garment illustrations, not merchant inventory.

Next.js setup follows the [official installation documentation](https://nextjs.org/docs/app/getting-started/installation).

## Seller console

`/console` provides account registration, login/logout, store setup and store-scoped
API key management. Set `METR_API_URL`, canonical HTTPS `SITE_URL` and a separate
random `CONSOLE_PROXY_KEY` (at least 32 characters), matching the API server.
The configured API base URL is `https://metr-fit-yjc3zwhbia-ue.a.run.app`.
Set it in the website server's runtime environment; `.env.example` documents the
value and does not configure a deployed server.
The website does not store accounts or passwords; these live in the API's Metr
Atlas database. Server credentials and session tokens never enter browser JSON.
New integration API-key secrets are deliberately shown once to save on a backend.

Shopify authorization additionally requires the API's Shopify app configuration.
Register `https://metr.so/api/console/shopify/callback` as the app redirect URL
and `https://metr.so/console` as its standalone launch URL. Signed app launches
are verified by the API, retained in a short-lived HttpOnly cookie through sign-in,
and used only after the seller explicitly selects an owned Metr store and reviews
both the verified Shopify shop and saved Metr store. Signed launch parameters are
removed from the browser URL. Expired or malformed launch cookies are cleared.
Callback failures preserve only fixed error categories and validated request IDs. After building, run
`node scripts/verify-shopify-proxy.mjs` to check the real gateway and cookies
with a local fixture API; this does not test Atlas or live Shopify. Launches alone never save
a connection; OAuth still requires HMAC and exact session/state/shop checks.
Authorization does not import products or install a sizing widget. Sellers must
select **Sync catalog** after connecting. Resync preserves product type, gender,
fit, stretch and chart links; missing Shopify items become unavailable. Sync imports
no size charts: add and verify charts before enabling recommendations. A previous
sync does not guarantee current stock. Sync proxy requests allow 35 seconds (within
Netlify’s 60-second synchronous function limit); uncertain outcomes refresh
connection status and require a manual retry. Expired access
tokens require reconnection until automatic token refresh is implemented.
See `../metr_api/docs/console.md` for setup, implemented boundaries and release gates.
Email verification and password recovery are not implemented in this first version.
Do not open public onboarding until those paths and dedicated Atlas/live Shopify
verification are complete. Production uses Secure HttpOnly SameSite=Lax host-only
cookies; state-changing requests require an exact same-origin header and a custom
request header. No integration API key or operator bootstrap key authenticates the
seller console.

## Production environment on Netlify

Set these through Netlify's environment-variable settings for the production
context. Values in `.env.local` are private local configuration and are not pushed.
Variables in `netlify.toml` are not available to serverless functions.

| Variable | Value | Scope |
| --- | --- | --- |
| `SITE_URL` | `https://metr.so` | Builds and Functions |
| `METR_API_URL` | `https://metr-fit-yjc3zwhbia-ue.a.run.app` | Builds and Functions |
| `METR_STORE_ID` | Sample-store ID from the private credential file | Builds and Functions |
| `METR_API_KEY` | Sample-store key from the private credential file | Builds and Functions |
| `CONSOLE_PROXY_KEY` | Matching proxy key from the private credential file | Functions |
| `AWS_LAMBDA_JS_RUNTIME` | `nodejs22.x` | Builds |
| `TRUST_PROXY` | `false` | Functions |

The credential source is `../metr_api/.deploy/website-credentials.env`. Import its
values securely; never copy credentials into tracked files or browser variables.
Rebuild after configuring the environment, since the Fit demo is prerendered.
See [Netlify's environment-variable documentation](https://docs.netlify.com/build/functions/environment-variables/).

Netlify's ephemeral functions cannot safely persist the current SQLite access
requests. A shared database implementation or a persistent Node host is required
before enabling production access requests; setting `LEADS_DB_PATH` to `/tmp` does
not solve persistence. Shopify is unavailable until the backend operator configures
the app credentials, encryption key and `https://metr.so/api/console/shopify/callback`.

Production Turbopack disk caching is disabled because its cache can retain server
credential values. If Netlify restored a cache from an older build, use **Clear
cache and deploy site** after this change. Keep secret scanning enabled.

Netlify secret scanning excludes only the public `SITE_URL`, `METR_API_URL` and
`AWS_LAMBDA_JS_RUNTIME` settings. Keep `CONSOLE_PROXY_KEY` and `METR_API_KEY` marked
as secrets and scanned. Public URLs are expected in generated metadata and docs.
