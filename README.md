# Website Development

Personal website workspace with:
- Frontend: Vite + TypeScript multi-page app
- Backend: FastAPI service
- Web server: Nginx (via Docker Compose)

## Project Structure

```text
frontend/                      Source code (Vite + TS)
  index.html
  docs.html
  apps/
    demo/
    graph-platform/
  src/
    pages/
      home/
      docs/
    apps/
      graph-platform/
    shared/
    styles/

public/                        Build output served by Nginx
  index.html
  docs.html
  assets/
  apps/
    graph-platform/
    demo/

backend/                       FastAPI
  src/main.py
  data/                        Runtime data (gitignored)

nginx/
  default.conf

docker-compose.yml
deploy_vps.sh                  Linux VPS one-click deploy script
deploy_local.ps1               Windows local one-click deploy script
```

## Requirements

- Node.js + npm
- Docker + Docker Compose
- Git

## Frontend Build (Manual)

```bash
cd frontend
npm ci --include=dev
npm run build
```

This writes static output into `public/`.

## Run Full Stack (Manual)

```bash
docker compose up -d --build
```

Health endpoint:
- `http://127.0.0.1/api/health`

## One-Click Deploy Scripts

### 1) Linux VPS

Script: `deploy_vps.sh`

```bash
cd /opt/website_development
chmod +x deploy_vps.sh
./deploy_vps.sh
```

What it does:
1. Verifies Git working tree is clean
2. Pulls latest code (`git pull --ff-only origin main`)
3. Installs frontend deps (`npm ci --include=dev`)
4. Builds frontend (`npm run build`)
5. Runs Docker Compose (`up -d --build`)
6. Prints service status and health check

### 2) Windows 11 Local

Script: `deploy_local.ps1`

```powershell
cd "E:\Programs\website development"
.\deploy_local.ps1
```

Optional custom branch/remote:

```powershell
.\deploy_local.ps1 -Remote origin -Branch main
```

What it does:
1. Verifies Git working tree is clean
2. Pulls latest code
3. Installs frontend deps
4. Builds frontend
5. Runs Docker Compose up/build
6. Checks `http://127.0.0.1/api/health`

## Common Troubleshooting

### Build error: cannot resolve `@fortawesome/fontawesome-free`

Run:

```bash
cd frontend
rm -rf node_modules
npm ci --include=dev
npm run build
```

Check file exists:

```bash
ls node_modules/@fortawesome/fontawesome-free/css/all.min.css
```

### Docker command not found

Install Docker Desktop (Windows) or Docker Engine + Compose plugin (Linux).

## Notes

- Commit frontend source changes together with updated `public/` build artifacts.
- Do not commit runtime data under `backend/data/`.
- `.env` is not committed. Use `.env.example` as template.
