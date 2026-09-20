<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Metr website instructions

## Scope and structure

This repository contains Metr's public website and developer documentation. The site sells one product, Metr Fit; product search (Discover) was removed and `/discover` redirects to `/fit`. Do not reintroduce search copy, pages or demos without being asked. The standalone Metr Fit API lives in the sibling `../metr_api` repository. Keep backend sizing, merchant authentication and catalog persistence there.

Read `README.md` and the relevant existing components before editing. Preserve unrelated changes. Prefer native HTML/CSS, existing helpers and the smallest correct implementation; avoid new UI libraries or abstractions without a concrete need.

- `src/app`: App Router pages, metadata, sitemap and the access-request endpoint.
- `src/app/[slug]/page.tsx`: product and company pages.
- `src/components/site.tsx`, `navigation.tsx`, `rule.tsx`: shared visual components.
- `src/components/demos.tsx` and `src/lib/demo.ts`: illustrative fallback sizing demo.
- `src/components/fit-live.tsx`, `src/lib/fit.ts`, `src/app/api/fit/route.ts`: live Metr Fit demo.
- `src/lib/content.ts`: shared website content.
- `src/app/globals.css`: design tokens and native CSS.
- `src/app/docs/[[...slug]]/page.tsx`, `src/components/api-reference.tsx`: developer documentation rendering.
- `src/lib/lead.ts` and `src/app/api/access/route.ts`: access-request validation and storage.

## Design and messaging

Preserve Metr's charcoal backgrounds, ivory text, restrained brass accents, Satoshi typography and measurement-inspired rules. Reuse existing tokens and components. Developer documentation belongs to the same visual system, not a separate theme.

Use concrete language that explains what the product does, who uses it and what it returns. Use “customer” instead of “shopper” in public copy. Avoid vague AI claims, invented performance figures and unsupported commercial promises.

Distinguish illustrative demos, implemented API functionality and planned integrations. Do not present fictional catalog examples as real merchant inventory or a live backend connection. Metr Fit confidence is an uncalibrated evidence score; do not call it a probability of correct fit or claim causal sales/return improvements.

Maintain semantic headings, labeled inputs, keyboard navigation, visible focus, contrast and reduced-motion support. Check mobile layouts and overflow in code examples, tables and navigation. Keep client components limited to interactions that require them.

## Developer documentation

The API repository is the source of truth for endpoint contracts and generated documentation content. Do not manually edit:

- `src/lib/generated/fit-docs.json`
- `src/lib/generated/fit-openapi.json`
- `public/api/metr-fit-openapi.json`

Update the backend implementation or `../metr_api/scripts/build_docs.py`, then run `make docs-sync` from `../metr_api`. Read that repository's instructions before changing its files. Check that the displayed examples, endpoint paths and downloadable contract agree. Do not document hypothetical endpoints or SDKs.

## Live Fit demo

`src/components/fit.tsx` chooses between the illustrative `FitDemo` and the live `FitLiveDemo` based on `fitConfig()`. The live component calls `/api/fit` only; `METR_API_KEY` never reaches the browser. `src/app/api/fit/route.ts` proxies three actions (products, start, recommend) to the configured store, validates identifiers and answers in `src/lib/fit.ts`, and returns only the recommendation fields the UI renders. Keep the demo catalog a sample store, keep confidence labelled as an uncalibrated evidence score, and do not add endpoints the API does not implement.

## Access requests and security

Preserve origin checks, input validation, body-size limits, honeypot, transactional rate limiting and explicit error states. Never expose API secrets or customer data in browser code, logs, examples or source control.

Access requests currently use SQLite. `LEADS_DB_PATH` must point to persistent private storage; this design cannot safely use an ephemeral serverless filesystem. Set `TRUST_PROXY=true` only behind a trusted proxy that replaces incoming forwarding headers. Do not add external analytics, messaging or lead forwarding without user authorization.

Keep provisional legal pages and integration availability accurately labeled. Review the README's launch requirements before deployment. Editing the website does not itself authorize publishing it.

## Development and verification

Use the Node version required by `package.json` and the installed Next.js documentation referenced above. Brand originals are in `metr_assets`; public logos are in `public/brand`. Follow the README's Satoshi license/setup instructions instead of substituting unlicensed font assets.

```sh
npm run dev
npm test
npm run build
npm run check
```

Run relevant tests and a production build for functional changes. Add focused regression checks for changed validation or interaction logic. Inspect UI changes at desktop and mobile sizes when browser access is available; report visual verification as unavailable if it was not performed.

For documentation changes, verify internal links, section anchors and OpenAPI parity with the backend. Do not hand-edit `.next` output or `next-env.d.ts`. Preserve the generated Next.js instruction block in this file. Report actual checks and remaining limitations; do not claim a deployment or live API integration without testing it.
