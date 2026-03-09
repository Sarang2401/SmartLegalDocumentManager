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


# ── GET /documents ────────────────────────────────────────────────────────────

@router.get("", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """List all active documents."""
    return svc.list_documents(db)


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


# ── PATCH /documents/{id}/title ───────────────────────────────────────────────

from app.schemas.document import DocumentTitleUpdate

@router.patch("/{document_id}/title", response_model=DocumentResponse)
def update_title(
    document_id: UUID,
    payload: DocumentTitleUpdate,
    db: Session = Depends(get_db),
):
    """Update document title without creating a new version."""
    try:
        doc = svc.update_title(
            db,
            document_id=document_id,
            new_title=payload.title,
            modified_by=payload.modified_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return doc


# ── DELETE /documents/{id} ────────────────────────────────────────────────────

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    modified_by: str,
    db: Session = Depends(get_db),
):
    """Soft delete a document. Requires modified_by as a query parameter for audit log."""
    try:
        svc.delete_document(
            db,
            document_id=document_id,
            modified_by=modified_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── DELETE /documents/{id}/versions/{version} ─────────────────────────────────

@router.delete("/{document_id}/versions/{version_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_version(
    document_id: UUID,
    version_number: int,
    modified_by: str,
    db: Session = Depends(get_db),
):
    """Delete a specific version. Cannot delete if it is the only remaining version.
    Requires modified_by as query parameter."""
    try:
        svc.delete_version(
            db,
            document_id=document_id,
            version_number=version_number,
            modified_by=modified_by,
        )
    except ValueError as exc:
        msg = str(exc)
        if "final remaining" in msg:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)


# ── GET /documents/{id}/timeline ──────────────────────────────────────────────

from app.schemas.document import AuditLogResponse

@router.get("/{document_id}/timeline", response_model=list[AuditLogResponse])
def get_timeline(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    """Fetch activity timeline (audit logs) for a document."""
    try:
        logs = svc.fetch_timeline(db, document_id=document_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return logs
