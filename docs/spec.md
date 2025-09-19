# Draft Dodger Technical Overview

Draft Dodger keeps human editors in the driver's seat while AI suggestions stay accountable. This document captures the shared understanding of the stack, major components, and conventions for the repository so future contributors can get productive quickly.

---

## Stack Overview

### Frontend (TypeScript + React)
- **React + Vite**: fast local development with an easy upgrade path to Next.js if routing becomes more complex.
- **Monaco Editor**: embedded diff experience familiar to anyone who has used VS Code.
- **jsdiff**: produces the line-level hunks that power the accept/reject flow.
- **shadcn/ui + Tailwind CSS**: shared design system with sensible defaults.
- **Framer Motion**: light motion cues for review interactions.

### Backend (Python + FastAPI)
- **FastAPI** powers REST endpoints and WebSocket updates, backed by typed request/response models.
- **LLM Orchestrator** modules coordinate prompt construction, retries, and logging.
- **Document Pipeline** converts Markdown into export formats such as HTML, PDF, and Docx using tools like `weasyprint`, `reportlab`, or `pandoc`.
- **Background Jobs** sit behind a queue (Redis + RQ or Celery) to keep heavy exports off the request thread.

### Storage
- **Postgres** stores sessions and project history.
- **Redis** handles queues and real-time notifications.
- **S3/MinIO** retains generated exports.

---

## Repository Layout

```
draft-dodger/
  app/                     # FastAPI service
    main.py
    routers/
      proposals.py
      exports.py
    services/
      llm.py               # model calls, retries, tracing
      export.py            # md->html->pdf/docx
    models/                # pydantic schemas
    storage/               # database adapters
  web/                     # React + Vite frontend
    src/
      components/
      pages/
      lib/diff.ts          # wrapper around jsdiff
  infra/
    docker-compose.yml     # postgres, redis, minio
  docs/                    # product + engineering reference
```

---

## Guiding Principles
- **Diff in the browser.** Users should preview and approve changes before they are persisted.
- **Queue exports.** Long-running conversions run asynchronously and report back over WebSockets.
- **Markdown is canonical.** Every export format is derived from the Markdown source.
- **Human overrides win.** The interface makes it easy to decline AI changes and capture feedback.

---

Draft Dodger exists to keep AI-generated revisions reviewable and auditable. The stack above keeps that loop fast, observable, and pleasant to build on.
