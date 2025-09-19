from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi import Depends, FastAPI, WebSocket

from app.models.proposal import StreamUpdate
from app.routers import exports, proposals
from app.storage.database import DatabaseSession, get_session

app = FastAPI(title="Draft Dodger API", version="0.1.0")
app.include_router(proposals.router)
app.include_router(exports.router)


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/projects/{project_id}")
async def ws(project_id: str, ws: WebSocket, db: DatabaseSession = Depends(get_session)) -> None:
    await ws.accept()
    try:
        while True:
            await asyncio.sleep(1)
            update = StreamUpdate(
                project_id=project_id,
                message="heartbeat",
                timestamp=datetime.utcnow().isoformat(timespec="seconds"),
            )
            await ws.send_json(update.dict())
    finally:
        await ws.close()
