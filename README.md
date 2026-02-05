# Website Development Workspace

This repository hosts a personal website with a static frontend, a small FastAPI
backend for feedback and visit stats, and an Nginx reverse proxy for production.

Key ideas:
- `frontend/` is the source (Vite + TypeScript, multi-page).
- `public/` is the deployable static output served by Nginx.
- `backend/` provides feedback and visit-count APIs.
- `public/apps/graph-platform/` is a standalone app and is not built by Vite.

## Architecture

- Frontend (Vite, multi-page)
  - Home: `frontend/index.html` -> `public/index.html`
  - Docs: `frontend/docs.html` -> `public/docs.html`
  - Demo app: `frontend/apps/demo/index.html` -> `public/apps/demo/index.html`
- Backend (FastAPI)
  - Feedback submission
  - Visit tracking and stats
- Nginx
  - Serves `public/`
  - Proxies `/api/*` to the backend

## Repository layout

```
backend/                 FastAPI service
  Dockerfile
  requirements.txt
  src/main.py
  data/                  Runtime data (ignored by git)
frontend/                Vite + TS source
  index.html
  docs.html
  apps/
    demo/
  src/
    pages/
      home/
      docs/
    apps/
      demo/
    shared/
    styles/
  vite.config.ts
public/                  Deployable static site (build output + assets)
  index.html
  docs.html
  assets/
  apps/
    graph-platform/      Standalone app (do not modify unless needed)
    demo/
    matrix-platform/
    geo-platform/
  docs/                  Markdown docs and downloads
nginx/
  default.conf
docker-compose.yml
.env.example
```

## Quick start (Docker)

```bash
docker compose up -d --build
```

Default access (from `.env.example`):
- Web: http://127.0.0.1
- API: http://127.0.0.1/api/health

## Frontend development

```bash
cd frontend
npm install
npm run dev
```

Notes:
- Vite dev server does not proxy `/api` by default.
- For full-stack local testing, prefer Docker Compose.

Build static assets:

```bash
cd frontend
npm run build
```

This writes to `public/` and updates `public/index.html` and `public/docs.html`.

## Backend development

Run locally (without Docker):

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Docs system

Docs are served from `public/docs/` and configured by `public/docs/config.json`.

- Content lives in `public/docs/**.md`
- Downloads live in `public/docs/downloads/`
- The docs UI loads markdown at runtime via `fetch()`

If you add a new doc:
1. Create a new `.md` file under `public/docs/`.
2. Add it to `public/docs/config.json`.

## Adding a new app (Vite multi-page)

1. Create a new HTML entry:
   - `frontend/apps/<app>/index.html`
2. Add the TS entry:
   - `frontend/src/apps/<app>/main.ts`
3. Register it in `frontend/vite.config.ts` under `build.rollupOptions.input`
4. Run `npm run build`
5. The output will appear in `public/apps/<app>/`

If the app is a standalone static project (like graph-platform), place it
directly under `public/apps/<app>/` and do not add it to Vite.

## API endpoints (backend)

- `GET /api/health`           Health check
- `POST /api/feedback`        Submit feedback
- `GET /api/feedback`         Admin-only feedback list (X-Api-Key header)
- `POST /api/stats/visit`     Record a visit (deduped daily by IP + page)
- `GET /api/stats`            Aggregate visit stats
- `GET /api/stats/count`      Total visit count (for footer)

## Environment variables

See `.env.example`:

- `ENV_TYPE`
- `WEB_BIND_IP`
- `WEB_PORT`
- `ADMIN_API_KEY`

## Git and data

Runtime data is stored in `backend/data/` and is ignored by git.
Do not commit the SQLite database or generated data files.
