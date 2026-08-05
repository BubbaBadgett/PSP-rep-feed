# Publishing the PSP Rep Feed app

This is now a real, standalone web app (Vite + React) — not just a Claude.ai
artifact preview. It builds to plain static files, so it deploys anywhere
that serves static sites. I built and smoke-tested this project in full
(`npm install`, `npm run build`, served the output, confirmed every asset —
JS bundle, manifest, service worker, icons — returns 200) before handing it
over, so what you're getting is verified to actually build, not just
theoretically should.

I can't deploy it live myself — I don't have network access to hosting
providers or any account credentials — so this is the exact path to do it
yourself, whichever way you prefer.

## Fastest path: no CLI, no account setup (5 minutes)

The `dist/` folder in this package is the **already-built** app. Some hosts
let you deploy a folder directly with zero configuration:

- **Netlify Drop** — go to https://app.netlify.com/drop, drag the `dist/`
  folder onto the page. You get a live URL immediately.
- **Cloudflare Pages** (dashboard → "Upload assets") — same idea, drag `dist/`.

This gets you a real, shareable URL today. It won't auto-rebuild when you
change code, though — for that, use the Git-connected path below.

## Recommended path: connect a Git repo (auto-deploys on every push)

1. Push this project to a GitHub repo (or GitLab/Bitbucket).
2. **Vercel**: go to vercel.com → New Project → import the repo. It
   auto-detects Vite; no config needed. Click Deploy.
   — or via CLI: `npm i -g vercel` then `vercel` from this folder.
3. **Netlify** (alternative): New site from Git → pick the repo. Build
   command `npm run build`, publish directory `dist`. Deploy.

Either way, every push to your main branch redeploys automatically — this is
the path you want once more than one person is touching the code.

## Custom domain

Both Vercel and Netlify let you attach a real domain (e.g.
`repfeed.pspipe.com`) under the project's Domain settings — add the domain,
then add the CNAME/A record they give you at your DNS provider. Propagation
usually takes a few minutes to a few hours.

## The optional backend URL

If you deploy `psp-integrations-backend` (the separate Node project from
earlier — Outlook/RingCentral/White Cup/Eclipse auth), you can pre-fill its
URL here instead of every admin typing it into Profile → Integrations by
hand:

- **Vercel/Netlify dashboard**: Project Settings → Environment Variables →
  add `VITE_BACKEND_URL` = `https://your-backend-url.com`, redeploy.
- **Local `.env`**: copy `.env.example` to `.env` and fill it in before
  running `npm run build`.

Leave it unset and the app works exactly as it does now — the field just
stays blank until someone fills it in manually.

## What's already built in

- **PWA packaging**: `manifest.webmanifest`, a full icon set, and a minimal
  service worker are in `public/`. Once this is live on HTTPS (Vercel/
  Netlify give you HTTPS automatically), iOS "Add to Home Screen" and
  Android's "Install app" prompt both work properly — a real branded icon
  and splash instead of a generic browser bookmark. This was a known gap
  flagged earlier in this build; it's done now.
- **Tailwind via CDN script** in `index.html` — this app was built against
  Claude.ai's built-in Tailwind runtime and only uses core utility classes,
  so the CDN script is a genuine zero-config drop-in. It's fine at this
  scale (internal tool, not high-traffic public site). If this grows into
  something with real load, the honest next step is swapping it for a
  proper Tailwind build (`postcss` + `tailwindcss` as devDependencies, an
  `index.css` with `@tailwind` directives) — same utility classes, smaller
  JS payload, no runtime compile. I didn't do that swap now since it adds
  build complexity this project doesn't need yet, but it's a clean,
  contained change whenever it's warranted.

## What's still separate

- **`psp-integrations-backend`** is its own deploy — a real Node service
  holding OAuth secrets, which is why it can't live in this frontend
  project. Its own README covers hosting it (needs a plain Node host —
  Render, Railway, Fly.io, a VPS — not a static host like Vercel/Netlify's
  default tier, since it needs to keep a server process running).
- **Vendor credentials** (Microsoft app registration, RingCentral app,
  White Cup and Eclipse specifics) still need to come from each vendor, same
  as documented in the backend's own README and the earlier setup guide.

## Local development

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build → dist/
npm run preview  # serve the production build locally to sanity-check it
```
