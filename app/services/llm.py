"""Placeholder LLM orchestration helpers."""

from __future__ import annotations

from datetime import datetime

from app.models.proposal import ProposalRequest, ProposalResponse


async def generate_proposal(request: ProposalRequest) -> ProposalResponse:
    """Return a mock proposal until the real LLM pipeline is wired up."""
    proposed = request.current.strip()
    if not proposed.endswith("\n"):
        proposed += "\n"
    proposed += "\n## Next Steps\n- Integrate the actual LLM backend.\n"
    return ProposalResponse(
        proposed=proposed,
        created_at=datetime.utcnow().isoformat(timespec="seconds"),
    )
