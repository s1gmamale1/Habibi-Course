# Deploying to a VPS

**Status:** the migration is **proven, not yet performed.** `next.config.ts` still says
`output: "export"`. Flip it when the first server-dependent feature lands — see *When to flip*
at the bottom.

**Decision:** ADR-007 in `ROADMAP.md`. Self-hosted Node on a VPS, chosen over
auth-as-a-service partly because learners will include children and self-hosting keeps their
data out of a third party's jurisdiction.

---

## What was actually tested (2026-08-11)

Not a plan on paper — this was run:

1. `output: "export"` → `output: "standalone"`
2. `npm run build`
3. Ran `node .next/standalone/server.js` and hit five real routes

| Route | Result |
|---|---|
| `/` | 200, 61 KB |
| `/lesson/1-01` | 200, 25 KB |
| `/practice/3-04` | 200, 41 KB |
| `/teach/4-01` | 200, 57 KB |
| `/checkpoint/checkpoint-2` | 200, 30 KB |

**Nothing broke.** All 230 pages still prerender as SSG — `generateStaticParams` behaves
identically, so the static-first architecture survives the move. The server boots in ~0 ms and
serves prerendered HTML; it is only *there* so that route handlers and sessions become
possible later.

**Artifact sizes:** `.next/standalone` **91 MB** (it traces its own `node_modules`),
`.next/static` **1.9 MB**.

### The one gotcha, found by hitting it

`output: "standalone"` does **not** copy `.next/static` or `public/` into the standalone
directory. The server starts fine and serves HTML, then every stylesheet, script and image
404s. Both must be copied in as a build step:

```bash
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
```

This is expected Next.js behaviour, not a bug, and it is the single most common way a
standalone deploy looks broken for reasons that have nothing to do with the app.

---

## The simple deployment

Deliberately boring. No Docker, no orchestrator, no CI required.

### 1. On the VPS, once

```bash
# Node 22+ (matches what the build expects), git, and Caddy for TLS
sudo apt update && sudo apt install -y git caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

sudo adduser --system --group --home /srv/habibi habibi
sudo -u habibi git clone <repo-url> /srv/habibi/app
```

### 2. Build

```bash
cd /srv/habibi/app
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
```

### 3. `/etc/systemd/system/habibi.service`

```ini
[Unit]
Description=Habibi Course
After=network.target

[Service]
Type=simple
User=habibi
WorkingDirectory=/srv/habibi/app/.next/standalone
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3

# The app needs to read nothing outside its own directory and write nothing except
# the database, once there is one. Tighten now; it is far harder to add later.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/habibi/data

[Install]
WantedBy=multi-user.target
```

`HOSTNAME=127.0.0.1` binds to loopback so the Node process is not directly reachable —
Caddy is the only thing exposed.

### 4. `/etc/caddy/Caddyfile`

```
habibi.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews TLS automatically. That is the whole reason to prefer it over
nginx + certbot here: it removes the certificate-renewal cron that eventually fails silently.

### 5. Start

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now habibi caddy
```

### Redeploying

```bash
cd /srv/habibi/app && git pull && npm ci && npm run build \
  && cp -r .next/static .next/standalone/.next/static \
  && cp -r public .next/standalone/public \
  && sudo systemctl restart habibi
```

There is a visible restart. At this scale that is fine; zero-downtime deploys are a problem
worth solving only when someone would actually notice.

---

## When accounts arrive

**Database: SQLite, on the same box.** Not a hedge — at this scale it is the correct choice.
A single file, no second service, no network hop, and trivially backed up by copying it.
Postgres earns its keep at concurrency this project will not see for a long time; adopt it
when there is a reason, not in advance.

Put it **outside the git checkout** so a redeploy cannot clobber it:

```
/srv/habibi/data/habibi.db     # ReadWritePaths in the unit above already allows exactly this
```

**Back it up before the first real user, not after.** `sqlite3 habibi.db ".backup ..."` on a
timer, off-box. A course carrying a child's months of progress has exactly one irreplaceable
artifact and this is it.

**Auth:** with our own server, session cookies (`HttpOnly`, `Secure`, `SameSite=Lax`) and a
password hash (argon2id) need no third party. The constraints recorded in `WISHLIST.md` apply
directly here — minimal fields, parent-held accounts for minors, and a deletion path designed
in from the first migration rather than retrofitted.

**`/teach` becomes a role.** It currently ships all 74 teacher notes as public static pages.
The moment there is a session, it must be gated — and once the runtime is a server, that is a
middleware check rather than a rebuild.

---

## When to flip `output`

**Not yet.** While every page is prerendered and there is no session, static export is
strictly simpler and can be hosted anywhere for free. Flipping early buys an ops burden and a
running process in exchange for nothing.

**Flip on the same commit as the first server-dependent feature** — the first route handler,
the first session read, the first database call. The migration is proven, so it is a
three-line change and a redeploy, not a project.
