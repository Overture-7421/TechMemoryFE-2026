# TechMemory — Development Checklist

Updated 2026-08-11. Client (React/Vite/Tailwind) at project root
(`techmemory/`), server (Express) in `techmemory/server/`. Oracle Autonomous
DB is wired up and live. Submission workflow: `POST /api/docs` is open to
anyone (author types their name, email, doc), lands as `STATUS='PENDING'`;
mentors (`MENTOR_AUTH_USER`/`MENTOR_AUTH_PASSWORD`, plain HTTP Basic Auth,
browser-native prompt) review the queue at `GET /api/docs/pending`, then
publish / edit / reject-with-a-reason / delete outright. Published docs
(`STATUS='PUBLISHED'`) are what the public GET endpoints return. Full round
trip verified against the live DB.

**Not yet decided/started: actual deployment.** See the dedicated section
below — that's the current focus.

## P0 — done

- [x] Crash visibility — `unhandledRejection`/`uncaughtException` handlers
      in `server.js`.
- [x] Input validation on write routes — length caps matching the schema,
      tag count/length caps, `express.json()` limit raised to 2mb.
- [x] Auth on mentor-only actions — `server/middleware/mentorAuth.js`
      (`requireMentorAuth` hard-gates PUT/DELETE/publish/reject/pending;
      `attachMentorFlag` softly tags GET requests so a `PENDING`/`REJECTED`
      doc 404s for non-mentors instead of leaking).
      `MENTOR_AUTH_USER`/`MENTOR_AUTH_PASSWORD` in `.env`.
- [x] Author + moderation queue — `AUTHOR`/`STATUS` columns added via
      `server/db/migrations/001_add_author_status.sql`. New submissions
      always insert as `PENDING` server-side regardless of what the client
      sends — there is no client-controllable way to self-publish.
- [x] Rejection + author notification — `server/db/migrations/002_add_rejection_notice.sql`
      adds `AUTHOR_EMAIL`/`REVIEW_NOTE` + a `REJECTED` status.
      `POST /:id/reject` (mentor-only, requires a reason) preserves the doc
      instead of deleting it and emails the author via Gmail SMTP
      (`server/email.js`). Email send is best-effort — never blocks the
      reject itself; see `server/EMAIL_SETUP.md` for the head-coach setup
      steps (still pending their Gmail App Password as of this writing).

## P1 — before this goes anywhere public

- [ ] **No git repo.** `techmemory/` isn't version-controlled at all right
      now — everything so far only exists on this machine's disk. This is
      now a hard blocker, not just a nice-to-have: both the GitHub Pages
      deploy and Render's deploy flow expect to pull from a real GitHub
      repo. `git init` + an initial commit + a GitHub remote is step 1 of
      the deployment plan below.
- [ ] **HTTPS in front of the server.** Basic Auth credentials are just
      base64 — not encrypted — so the mentor password is sent in the clear
      on plain HTTP. Render provides HTTPS automatically on its
      `*.onrender.com` URL, so this is satisfied for free once deployed
      there — nothing to build, just don't accidentally call the API over
      plain `http://` from the frontend.
- [ ] **Something to restart the server on crash.** The
      `uncaughtException` handler logs and exits by design, but nothing
      currently brings the process back up locally. Also satisfied for
      free by Render — a Web Service there restarts a crashed process
      automatically. Still relevant if this ever runs somewhere else
      (a bare VM, etc.).
- [ ] **CORS is wide open** (`app.use(cors())`, no options). Needs to be
      locked to the real GitHub Pages origin once that URL exists — see
      "Deployment plan" below, step 5.
- [ ] **`POST /api/docs` is public with no rate limiting.** Anyone who
      finds the URL can flood the pending queue — low real risk while it's
      an internal team tool, but worth a basic rate limiter
      (`express-rate-limit`) before wider exposure, since a mentor now has
      to manually clear spam out of Pending instead of it being rejected
      outright.
- [ ] Add tests — neither client nor server has a single test file.

## Deployment plan: GitHub Pages (frontend) + Render (backend)

**Short answer: split it in two, both parts of that instinct were right.**
GitHub Pages is a real, viable place to serve the app — but only the
built React/Vite output (static HTML/CSS/JS). It cannot run `server/` at
all: no Node runtime, no way to hold a persistent Oracle connection pool,
no place to keep secrets like `DB_PASSWORD` or `SMTP_APP_PASSWORD` outside
the public bundle. Render is the piece that runs `server/` as a real,
always-listening Node process with its own HTTPS and restart-on-crash —
which is also why several P1 items above become free once you deploy
there instead of self-hosting.

So: **frontend → GitHub Pages, backend (`server/`) → Render.** Two
separate deploys, two separate URLs, talking to each other over HTTPS.
This is a completely standard split (same shape as any SPA + hosted API)
and is not a workaround — it's the right architecture for what this app
already is.

```
Browser
  │
  ├─ loads static bundle from  https://<user>.github.io/<repo>/   (GitHub Pages)
  │
  └─ bundle's JS calls          https://overture-docs-api.onrender.com/api/*   (Render)
                                          │
                                          ├─ Oracle Autonomous DB (via wallet)
                                          └─ Gmail SMTP (rejection emails)
```

### Missing pieces — frontend / GitHub Pages side

- [ ] **The frontend doesn't know the backend's URL yet.** `src/api.js`
      calls relative paths (`/api/docs`), which only resolve correctly
      today because `vite.config.js` proxies `/api` → `localhost:3001` in
      dev. GitHub Pages serves no such proxy — it's a plain static host.
      Needs a build-time env var (e.g. `VITE_API_BASE_URL`, Vite's
      standard `import.meta.env` mechanism) baked into the production
      build, with `api.js`'s `BASE_URL` switched to use it.
- [ ] **Decide user page vs project page**, since it changes the URL shape
      and `vite.config.js`:
      - User/org page (`<user>.github.io`) → serves at the domain root
        (`/`). No config change needed.
      - Project page (`<user>.github.io/<repo>/`) → serves under a
        subpath. Needs `base: '/<repo>/'` set in `vite.config.js`, or
        every asset URL 404s.
      There's no client-side router yet (`App.jsx` just swaps views by
      state, not by URL), so this only affects the Vite `base` config and
      asset paths — not a routing rewrite.
- [ ] **No build/deploy automation yet.** Needs a GitHub Actions workflow
      (`actions/deploy-pages` is the standard one) that runs `npm run
      build` and publishes `dist/` on push to `main`. Depends on the git
      repo existing first.

### Missing pieces — backend / Render side

- [ ] **Getting the Oracle wallet onto Render.** `server/wallet/` (7
      files: `cwallet.sso`, `ewallet.p12`, `ewallet.pem`, `keystore.jks`,
      `ojdbc.properties`, `sqlnet.ora`, `tnsnames.ora`, plus `README`) is
      gitignored on purpose and can't just be committed. Use Render's
      **Secret Files** feature — each file gets uploaded individually in
      the dashboard and mounted at a path you choose at runtime (e.g.
      `/etc/secrets/wallet/tnsnames.ora`, etc.) — then set
      `TNS_ADMIN=/etc/secrets/wallet` as a normal env var. This is exactly
      what that feature is for; don't try to smuggle binary wallet files
      through regular env vars.
- [ ] **Environment variables to set in Render's dashboard:** `DB_USER`,
      `DB_PASSWORD`, `DB_CONNECT_STRING`, `TNS_ADMIN` (the Secret Files
      mount path above), `WALLET_PASSWORD`, `MENTOR_AUTH_USER`,
      `MENTOR_AUTH_PASSWORD`, `SMTP_USER`, `SMTP_APP_PASSWORD` (see
      `server/EMAIL_SETUP.md`). `PORT` needs no action — Render injects
      its own and `server.js` already reads `process.env.PORT` with a
      fallback.
- [ ] **Root directory / build / start commands.** The repo root has both
      the Vite frontend and `server/` — Render needs to be told the API
      lives in `server/`: set Render's "Root Directory" to `server`,
      build command `npm install`, start command `npm start`.
- [ ] **Health check.** `GET /api/health` already exists and returns
      `{status:"ok"}` — point Render's health check at it, no work needed.
- [ ] **Free-tier cold starts.** Render's free instance type spins down
      after ~15 minutes idle and takes tens of seconds to spin back up on
      the next request — and `initPool()` (Oracle connection setup) runs
      during that cold start too, so the very first request after idle
      will be slow. Fine for a small team tool used in bursts; if that
      becomes annoying later, the fix is a paid "always on" instance, not
      a code change.

### Cross-cutting

- [ ] **CORS lockdown**, once the GitHub Pages URL is known: replace
      `app.use(cors())` with an explicit allow-list of that origin (e.g.
      `cors({ origin: process.env.ALLOWED_ORIGIN })`), so the API isn't
      callable from just any site.
- [ ] **Secrets stay server-side only.** The GitHub Pages bundle is 100%
      public — anything shipped in it is visible to anyone. Never let
      `DB_PASSWORD`, `MENTOR_AUTH_PASSWORD`, `SMTP_APP_PASSWORD`, etc. end
      up in a `VITE_*` env var or the frontend build. Only
      `VITE_API_BASE_URL` (just a URL, not a secret) belongs there.
- [ ] Custom domain: not required for either side — GitHub Pages and
      Render both give working free subdomains (`<user>.github.io`,
      `<service>.onrender.com`). Only becomes relevant again if Gmail
      SMTP's ~500/day send limit is ever outgrown and a real transactional
      provider is worth the domain-verification cost (see
      `server/EMAIL_SETUP.md`).

### Suggested order of operations

1. `git init`, first commit, create the GitHub repo, push. Blocks
   everything below.
2. Deploy the backend to Render first — it's the harder half, and the
   frontend needs to know its URL before it can be built for production.
   Wire up env vars + Secret Files for the wallet, confirm
   `https://<service>.onrender.com/api/health` responds.
3. Add `VITE_API_BASE_URL` support to `src/api.js`, decide user vs project
   GitHub Pages page and set `vite.config.js`'s `base` accordingly.
4. Add the GitHub Actions workflow to build + publish to GitHub Pages on
   push to `main`.
5. Lock down CORS on Render to the now-known GitHub Pages origin.
6. Get the Gmail App Password from the head coach (`server/EMAIL_SETUP.md`)
   and set `SMTP_USER`/`SMTP_APP_PASSWORD` on Render.
7. Smoke-test the full loop live: submit a doc on the GitHub Pages site →
   mentor logs in and rejects it with a note → author gets the email.

## P2 — known tradeoffs, not blocking

- [ ] Mentor auth is one shared username/password for everyone with the
      role — no per-mentor identity, so there's no audit trail of *which*
      mentor published/rejected/deleted a given doc. Fine for a small team;
      revisit if that accountability starts to matter.
- [ ] Revisit search once doc volume grows — currently client-side substring
      filter over all loaded docs (`Sidebar.jsx`); fine at current scale, but
      won't hold up long-term. Consider a DB-side query or Oracle Text.
