# Website Development

Personal website repository with:
- Frontend: Vite + TypeScript multi-page app
- Backend: FastAPI service
- Web server: Nginx (Docker Compose)

## Project Structure

```text
frontend/                      Vite source
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

backend/                       FastAPI service
  src/main.py
  data/                        Runtime data (gitignored)

public/                        Generated static output (not tracked)
nginx/
  default.conf

docker-compose.yml
deploy_vps.sh                  Linux VPS deploy script
deploy_local.ps1               Windows local deploy script
package_for_vps.ps1            Windows packaging script (zip for manual upload)
```

## Requirements

- Node.js + npm
- Docker + Docker Compose
- Git

## Build Frontend Manually

```bash
cd frontend
npm ci --include=dev
npm run build
```

Build output goes to `public/`.

## Run Full Stack Manually

```bash
docker compose up -d --build
```

Health endpoint:
- `http://127.0.0.1:<WEB_PORT>/api/health`

## One-Click Deploy

### Linux VPS

```bash
cd website_development
bash deploy_vps.sh
```

Optional English output:

```bash
DEPLOY_LANG=en bash deploy_vps.sh
```

Script flow:
1. Check Git working tree is clean
2. Pull latest code (`git pull --ff-only origin main`)
3. Install frontend dependencies
4. Build frontend
5. Rebuild and start Docker services
6. Read `WEB_PORT` from `.env` and run health check on that port
7. Print service status and health check result

### Windows Local

```powershell
cd website_development
.\deploy_local.ps1
```

Optional:

```powershell
.\deploy_local.ps1 -Remote origin -Branch main
```

## What Is `package_for_vps.ps1`?

`package_for_vps.ps1` is a Windows helper script for packaging the project into a zip file (`deploy_package.zip`) for manual VPS upload.

Use it when:
- You do not use `git pull` on the server
- You want to upload a deployment package via panel/file manager

What it does:
1. Creates a temporary folder
2. Copies project files while excluding `.git`, `.venv`, `node_modules`, logs, and cache files
3. Generates `deploy_package.zip`
4. Cleans temporary files

Run it on Windows PowerShell:

```powershell
.\package_for_vps.ps1
```

## Troubleshooting

### Cannot resolve `@fortawesome/fontawesome-free`

```bash
cd frontend
rm -rf node_modules
npm ci --include=dev
npm run build
```

Optional check:

```bash
ls node_modules/@fortawesome/fontawesome-free/css/all.min.css
```

### Deploy script says working tree is not clean

Check changed files:

```bash
git status
```

Restore a single changed file:

```bash
git restore <file>
```

## Notes

- Frontend generated output is not tracked in Git.
- Do not commit runtime data in `backend/data/`.
- `.env` is not committed. Use `.env.example` as template.
