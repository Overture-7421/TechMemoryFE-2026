# techmemory (frontend)

React + Vite frontend for TechMemory, the team's docs library. The API server used to
live in `server/` in this same repo — it's been split out to its own repo
(`techmemory-server`, sibling folder) so it can run on a real Node host
instead of GitHub Pages. See that repo's `DEPLOY.md` for backend deploy
steps.

## Local dev

```
npm install
npm run dev
```

Requests to `/api/*` are proxied to `http://localhost:3001` (see
`vite.config.js`) — run the server separately alongside this.

## Deploying to GitHub Pages

1. Set the deployed backend's URL as a repo variable: **Settings → Secrets
   and variables → Actions → Variables → New repository variable**,
   `VITE_API_BASE_URL` = `https://<your-server>.onrender.com` (see
   `.env.example`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main` — `.github/workflows/deploy.yml` builds and deploys
   automatically.
4. Served on the custom domain `techmemory.overture7421.org` (DNS CNAME
   record → `overture-7421.github.io`, custom domain set under Settings →
   Pages). Because it's served from the domain root and not a `/<repo>/`
   subpath, `vite.config.js` sets `base: "/"` and `public/CNAME` holds the
   domain — Vite copies it into `dist/` on build so GitHub Pages re-applies
   the custom domain each deploy. If the site ever moves back to the
   `<user>.github.io/<repo>/` project-pages URL, revert `base` to
   `/TechMemoryFE-2026/` and delete `public/CNAME`.
5. On the server side, set `ALLOWED_ORIGINS` to this domain
   (`https://techmemory.overture7421.org`) so CORS allows it.
