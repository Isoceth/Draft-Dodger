from __future__ import annotations

from fastapi import APIRouter

from app.models.proposal import ProposalRequest, ProposalResponse
from app.services.llm import generate_proposal

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("", response_model=ProposalResponse)
async def create_proposal(request: ProposalRequest) -> ProposalResponse:
    """Create a proposal by delegating to the LLM service layer."""
    return await generate_proposal(request)
