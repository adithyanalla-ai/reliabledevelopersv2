# Reliable Developers, Refinement 2.0

Premium real-estate website for Vijayawada and the Amaravati capital region.
Static, prerendered pages (clean URLs, real HTML for crawlers) plus a small serverless lead API and a Supabase schema.

## What is complete and tested here
Pages, navigation, split hero, search, categories, locations (8 unique pages), finder (7 steps), tools, Property Confidence Centre, saved/compare/recently viewed, shareable filter URLs, empty states, English/Telugu, consent-gated analytics hooks, sitemap, robots, canonicals, JSON-LD, legacy `#/` redirects, lead API with the success-only-after-storage rule, SQL migration with RLS and audit log.
Automated tests are in `tests/` (`audit.py`, `flows.py`, `links.py`; `server.mjs` serves `dist/` with a mock Supabase/Resend/Meta).

## What needs YOUR input or credentials
| Item | What to do |
|---|---|
| Contact details | Fill `data/site.json` or the env vars in `.env.example` (phone, WhatsApp, email, address, socials, RERA). Blank fields are hidden or replaced by an enquiry button. Nothing is invented. |
| Lead storage | Create a Supabase project, run `supabase/migrations/0001_init.sql`, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel (server-side only). Until then the forms show an error and offer WhatsApp/call, never a false success. |
| Team email | Set `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL`. |
| Analytics | Set `GTM_ID` (or `GA4_ID`, `META_PIXEL_ID`, `GOOGLE_ADS_ID/LABEL`). They load only after the visitor accepts. Meta CAPI: `META_CAPI_TOKEN` (uses the same `event_id` as the browser event). These were not run against live Google/Meta here. |
| Inventory | Add real listings to `data/properties.json` (use `/admin` to generate entries). It ships empty, so the site shows "We are curating our first listings". `data/properties.demo.json` only appears when `SHOW_DEMO=1` (preview), marked DEMO and noindex. |
| Legal pages | Privacy, terms, disclaimer are templates. Have a lawyer review them. |
| Telugu | `assets/js/i18n.js` needs a native-speaker review. |
| Location and article copy | Written from general knowledge. Check every fact before launch. |

## Not built (be aware)
This is not a Next.js/TypeScript app, and there is no Supabase Auth login, admin dashboard or CRM UI. `/admin` is a listing-JSON builder only. Manage leads in the Supabase Table Editor (status, assignee, follow-up and notes columns exist). Roles (admin/editor/sales), RLS and audit triggers are defined in SQL for when you add one.

## Deploy
1. Push this folder to GitHub with git or GitHub Desktop (dragging folders into the web uploader can flatten them).
2. Import in Vercel. `vercel.json` already sets the build command (`node scripts/build.mjs`) and output (`dist`).
3. Add environment variables, redeploy.
4. Set `SITE_URL` to the final domain so canonicals, sitemap and OG tags are correct.
Local: `node scripts/build.mjs`, then `node tests/server.mjs` and open http://localhost:4100.

## Images
All imagery is illustrative and labelled as such. Replace with real photography as it becomes available (keep the 480/800/1200 WebP naming or use file paths in a listing's `images`).
