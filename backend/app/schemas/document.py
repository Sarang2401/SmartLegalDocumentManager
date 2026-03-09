"""Pydantic schemas for Document and DocumentVersion API payloads."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Document ────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    content: str = Field(..., min_length=1)
    created_by: str = Field(..., min_length=1, max_length=255)


class DocumentResponse(BaseModel):
    id: UUID
    title: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


# ── DocumentVersion ──────────────────────────────────────────────────────────

class VersionCreate(BaseModel):
    content: str = Field(..., min_length=1)
    modified_by: str = Field(..., min_length=1, max_length=255)


class VersionResponse(BaseModel):
    id: UUID
    document_id: UUID
    version_number: int
    content: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Compare ──────────────────────────────────────────────────────────────────

class CompareResponse(BaseModel):
    document_id: str
    version_a: int
    version_b: int
    similarity: float
    diff: list[str]
    added: list[str]
    removed: list[str]
