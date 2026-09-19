# Metr

Next.js App Router + React + TypeScript. Native CSS, local Satoshi, approved Metr brand assets, and interactive fictional catalog examples.

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

## Before public launch

- Set `SITE_URL` to the verified domain for canonical URLs, social metadata, and sitemap.
- Review and approve Privacy/Terms, company naming, retention policy, and privacy contact. Current pages are explicitly provisional and noindexed.
- Configure persistent lead storage, backups, and an operational review process.
- Confirm integration availability; current connectors are accurately marked planned/in development.
- Analytics is intentionally not connected to an external provider; add the chosen first-party destination when approved.

## Assets

Brand originals live in `metr_assets`. Public logo copies are in `public/brand`. The supplied font is self-hosted for this website at `public/fonts/Satoshi-Variable.woff2`; font binaries are ignored by Git under the supplied license. On a fresh checkout, obtain Satoshi from Fontshare under its license and put the unchanged WOFF2 at that path. The site falls back to Helvetica if it is absent. Product drawings are original SVG garment illustrations, not merchant inventory.

Next.js setup follows the [official installation documentation](https://nextjs.org/docs/app/getting-started/installation).
