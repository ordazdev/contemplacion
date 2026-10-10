# Contemplación — website source

This package contains the complete source of the Contemplación coming-soon website, including the prepared original logo and video assets, Spanish copy, responsive styles, animations, and email signup backend.

Exported from published version 1, commit `585df63823745f0222b4ffa4c32772c1975b09c9`.

## Requirements

- Node.js 22.13 or newer and npm.
- A terminal and code editor.
- Internet access for the initial dependency installation.

This is a React/TypeScript project using Vinext, Vite, Cloudflare Workers, and D1. It is not a single HTML file. Keep the package lockfile and the build configuration when opening it in an IDE or an AI coding workspace.

## Run locally

Extract the ZIP, open a terminal inside `contemplacion-source`, and run:

```bash
npm ci
npm run build
```

Initialize the local signup database once, before testing the form:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_slippery_lord_hawal.sql
```

Then start the local production preview:

```bash
npm start
```

Open the local address printed in the terminal. The local database is independent of the live site's database. Do not rerun the initial SQL against a database where these tables already exist.

For editing with hot reload, stop the preview and run:

```bash
npm run dev
```

The development server is configured for port 5173. Rebuild with `npm run build` when you want to preview the updated production build.

## Where to edit

| File or folder | Purpose |
| --- | --- |
| `app/page.tsx` | All page sections, Spanish copy, scrolling behavior, and signup UI |
| `app/globals.css` | Colors, typography, layout, responsive rules, and motion |
| `app/layout.tsx` | Page metadata, language, and favicon configuration |
| `app/api/subscribe/route.ts` | Email validation, persistence, and optional GHL forwarding |
| `db/schema.ts` | Signup and request-limit tables |
| `drizzle/` | Database migration and migration metadata |
| `public/media/` | Original logo assets, prepared videos, and extracted frames |
| `public/fonts/` | Locally served Marcellus and Jost fonts |
| `public/favicon.svg` | Simplified shell favicon |
| `vite.config.ts` | Framework and Cloudflare runtime configuration |

The core media files are `place-film.mp4` for the hero, `logo-reveal.mp4` for the preloader, `shell.png` for the shell mark, and `wordmark.svg` for the original wordmark.

## Email signup and GoHighLevel

The form posts to `/api/subscribe`. A valid signup is stored in D1 before success is returned. The backend validates email and consent, deduplicates emails, checks request size and origin, and includes a honeypot and an IP-based rate limit when the hosting platform provides the client IP header.

Required production binding:

- `DB`: a Cloudflare D1 database with the included migration applied.

Optional server-side secret:

- `GHL_WEBHOOK_URL`: the HTTPS inbound-webhook URL for your GoHighLevel workflow.

GHL is **not connected in this export**. Configure that secret in your hosting runtime and configure the receiving workflow to create or update a contact. The payload contains `email`, `source`, `tags`, `consent`, `consent_version`, `created_at`, and `event_id`. Keep the webhook URL on the server.

Without the webhook, the backend stores signups with `ghl_status=pending`. A delivery failure also leaves the signup pending. The site does not send opening emails by itself. It has no scheduled delivery retries; earlier pending signups require a separate sync after GHL is connected. A repeated signup can retry an existing pending delivery.

The included `.env.example` documents the variable name. Merely filling in that file does not configure a deployed hosting secret.

## Hosting and reuse

The included `.openai/hosting.json` preserves the existing site's project identity. It is part of this source snapshot, not a deployment credential. If creating a separate Site, use that new project's hosting configuration instead of the original project ID.

For another hosting platform, retain a Cloudflare-compatible backend or adapt the signup route and database integration to that platform. A static-only upload will not provide working email capture.

When moving the design into an existing AI Studio project with a different framework, reuse the page, styles, and media and adapt the server route to that project's runtime. Do not assume its default backend supports the `cloudflare:workers` import.

## Included behavior

- Bounded preloader with the original logo-reveal video and counter.
- Fullscreen original footage with desktop scroll scrubbing.
- Scroll-assembled brand phrase and an editorial image mosaic.
- Mobile video playback, a direct signup anchor, and responsive layout.
- Reduced-motion support with still imagery.
- Email field, explicit consent, loading, confirmation, and error states.

The city/region, contact email, and social links were not supplied, so they remain omitted. Update the content when those details are available.

## Export notes

The archive contains the tracked source and assets, plus this guide. Dependencies, build output, private environment files, local database contents, and Git history are not included. Install dependencies using the included lockfile.

The published source was previously checked with a build, TypeScript validation, desktop/mobile previews, and local signup checks. This export was checked for archive integrity and required source/assets. The GHL workflow itself has not been configured or tested.
