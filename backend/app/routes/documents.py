"""FastAPI router for document and version endpoints (Milestone 3)."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.document import (
    DocumentCreate, DocumentResponse,
    VersionCreate, VersionResponse,
    CompareResponse,
)
from app.services import document_service as svc

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── POST /documents ───────────────────────────────────────────────────────────

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    """Create a new document. Version 1 is created automatically."""
    doc, _ = svc.create_document(
        db,
        title=payload.title,
        content=payload.content,
        created_by=payload.created_by,
    )
    return doc


# ── POST /documents/{id}/versions ─────────────────────────────────────────────

@router.post(
    "/{document_id}/versions",
    response_model=VersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_version(
    document_id: UUID,
    payload: VersionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Upload a new version for an existing document.

    Returns 409 if content is identical to the latest version.
    """
    try:
        version = svc.upload_version(
            db,
            document_id=document_id,
            content=payload.content,
            modified_by=payload.modified_by,
            background_tasks=background_tasks,
        )
    except ValueError as exc:
        msg = str(exc)
        if "No meaningful change" in msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
    return version


# ── GET /documents/{id}/versions ──────────────────────────────────────────────

@router.get("/{document_id}/versions", response_model=list[VersionResponse])
def list_versions(document_id: UUID, db: Session = Depends(get_db)):
    """Return all versions for a document, ordered by version number."""
    try:
        versions = svc.list_versions(db, document_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return versions


# ── GET /documents/{id}/compare?v1=&v2= ──────────────────────────────────────

@router.get("/{document_id}/compare", response_model=CompareResponse)
def compare_versions(
    document_id: UUID,
    v1: int,
    v2: int,
    db: Session = Depends(get_db),
):
    """Compare two versions of a document. Returns unified diff and similarity."""
    try:
        result = svc.compare_versions(db, document_id=document_id, v1=v1, v2=v2)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return result
