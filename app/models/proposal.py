from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel


class HunkKind(str, Enum):
    EQUAL = "equal"
    REPLACE = "replace"
    INSERT = "insert"
    DELETE = "delete"


class Hunk(BaseModel):
    kind: HunkKind
    oldText: str = ""
    newText: str = ""
    accepted: bool = False


class ProposalRequest(BaseModel):
    project_id: str
    base: str
    current: str
    instructions: str = ""


class ProposalResponse(BaseModel):
    proposed: str
    created_at: str


class MergeDecision(BaseModel):
    project_id: str
    hunks: List[Hunk]


class MergeResponse(BaseModel):
    status: str
    approved: str


class StreamUpdate(BaseModel):
    project_id: str
    message: str
    timestamp: str
