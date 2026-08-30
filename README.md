# techmemory (frontend)

React + Vite frontend for the Overture docs library. The API server used to
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
4. `vite.config.js` sets `base: "/techmemory/"` for the project-pages URL
   (`https://<user>.github.io/techmemory/`). Update it if the repo is
   renamed, or set it to `"/"` if you switch to a custom domain (and add a
   `public/CNAME` file with the domain).
5. On the server side, set `ALLOWED_ORIGINS` to this Pages URL so CORS
   allows it.
