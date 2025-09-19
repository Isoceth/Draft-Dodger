from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends

from app.models.proposal import HunkKind, MergeDecision, MergeResponse
from app.services.export import enqueue_export
from app.storage.database import DatabaseSession, get_session

router = APIRouter(prefix="/merge", tags=["merge"])


@router.post("", response_model=MergeResponse)
async def apply_merge(
    decision: MergeDecision,
    tasks: BackgroundTasks,
    db: DatabaseSession = Depends(get_session),
) -> MergeResponse:
    """Persist the accepted markdown and trigger exports."""
    approved = _apply_hunks(decision)
    db.save_document(decision.project_id, approved)
    tasks.add_task(enqueue_export, decision.project_id, approved)
    return MergeResponse(status="ok", approved=approved)


def _apply_hunks(decision: MergeDecision) -> str:
    pieces: list[str] = []
    for hunk in decision.hunks:
        if hunk.kind == HunkKind.EQUAL:
            pieces.append(hunk.oldText)
        elif hunk.kind == HunkKind.REPLACE:
            pieces.append(hunk.newText if hunk.accepted else hunk.oldText)
        elif hunk.kind == HunkKind.INSERT:
            if hunk.accepted:
                pieces.append(hunk.newText)
        elif hunk.kind == HunkKind.DELETE:
            if not hunk.accepted:
                pieces.append(hunk.oldText)
    return "".join(pieces)
