# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: Vite + TypeScript source. Multi-page entries live under `frontend/src/pages/`. Shared utilities and styles are in `frontend/src/shared/` and `frontend/src/styles/`.
- `public/`: Built static site output and static assets served by Nginx. This includes:
  - `public/index.html`, `public/docs.html` (built by Vite)
  - `public/assets/` (hashed build artifacts)
  - `public/docs/` (Chinese docs) and `public/docs-en/` (English docs)
  - `public/apps/graph-platform/` (standalone app, not built by Vite)
- `backend/`: FastAPI service (`backend/src/main.py`) and persisted data in `backend/data/` (ignored by Git).
- `nginx/`: Nginx config for serving `public/`.

## Build, Test, and Development Commands
Frontend (run from `frontend/`):
- `npm run dev` — local dev server.
- `npm run build` — outputs to `public/`.
- `npm run preview` — preview built output.
- `npm run lint` / `npm run lint:fix` — ESLint checks.
- `npm run format` — Prettier formatting.

Backend (run from `backend/`):
- `pip install -r requirements.txt`
- `uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload`

Full stack:
- `docker-compose up -d --build`

## Coding Style & Naming Conventions
- TypeScript: 2-space indentation, ESM modules, follow ESLint + Prettier.
- Python: 4-space indentation, follow standard PEP 8 style.
- Docs: keep Chinese in `public/docs/`, English in `public/docs-en/` with identical structure.

## Docs i18n Maintenance Rules
- `public/docs/config.json` is the single source of truth and must use `{ zh, en }` for all titles.
- Keep file paths identical between `public/docs/` and `public/docs-en/`.
- When adding a new doc, create both language files; if English is missing, the app falls back to Chinese.
- If a link should open in a new tab, use HTML `<a ... target="_blank" rel="noopener noreferrer">` in both languages.
- Do not rename or move files without updating `config.json`.

## Testing Guidelines
- No automated test suite is configured. Use manual checks:
  - `npm run build` and open `public/index.html` / `public/docs.html`.
  - Verify docs links, language toggle, and graph-platform entry.

## Commit & Pull Request Guidelines
- Commit messages follow conventional prefixes seen in history: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- When changing frontend, run `npm run build` and include updated `public/` artifacts.
- PRs should include a short summary, screenshots for UI changes, and note any docs or i18n updates.

## Security & Configuration Tips
- `.env` is not committed. Use `.env.example` as a template.
- Do not commit `backend/data/` (SQLite + JSON data are ignored).
