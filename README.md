# Draft Dodger

Draft Dodger helps teams review AI-generated edits without losing control of the source document. The project ships with a FastAPI backend, a Vite-powered React frontend, and infra scripts so you can get a full-stack prototype running quickly.

## Repository layout

- `app/` – FastAPI service with routers, services, and schemas.
- `web/` – React + Vite frontend housing the diff-review playground.
- `infra/` – Local Docker Compose stack for Postgres, Redis, and MinIO.
- `docs/` – Product and engineering reference material.

## Getting started

### Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API exposes `/proposals`, `/merge`, `/healthz`, and a WebSocket channel at `/ws/projects/{project_id}`.

### Frontend
```bash
cd web
npm install
npm run dev
```
Visit `http://localhost:5173` to explore the diff-review playground.

### Infrastructure
```bash
cd infra
docker compose up
```
This brings up Postgres, Redis, MinIO, and a placeholder API container running `uvicorn`.

## Next steps
1. Replace the mocked LLM orchestration in `app/services/llm.py` with real model calls and observability hooks.
2. Wire background jobs to a queue (RQ or Celery) and stream progress to the WebSocket.
3. Flesh out the frontend design system and connect it to the live API once authentication and persistence are in place.

## License
MIT
