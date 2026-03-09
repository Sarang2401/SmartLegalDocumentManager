"""Database access layer for documents and versions.

All direct SQLAlchemy queries live here. The service layer calls these
functions; routes never touch the DB directly.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.document_version import DocumentVersion


# ── Document ─────────────────────────────────────────────────────────────────

def create_document(db: Session, title: str, created_by: str) -> Document:
    doc = Document(title=title, created_by=created_by)
    db.add(doc)
    db.flush()  # get doc.id before version insert
    return doc


def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    return (
        db.query(Document)
        .filter(Document.id == document_id, Document.is_deleted == False)  # noqa: E712
        .first()
    )


def get_all_documents(db: Session) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.is_deleted == False)  # noqa: E712
        .order_by(Document.updated_at.desc())
        .all()
    )


# ── DocumentVersion ───────────────────────────────────────────────────────────

def create_version(
    db: Session,
    document_id: UUID,
    version_number: int,
    content: str,
    created_by: str,
) -> DocumentVersion:
    version = DocumentVersion(
        document_id=document_id,
        version_number=version_number,
        content=content,
        created_by=created_by,
    )
    db.add(version)
    db.flush()
    return version


def get_latest_version(db: Session, document_id: UUID) -> Optional[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
        .first()
    )


def get_versions(db: Session, document_id: UUID) -> list[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number)
        .all()
    )


def get_version_by_number(
    db: Session, document_id: UUID, version_number: int
) -> Optional[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version_number,
        )
        .first()
    )


def count_versions(db: Session, document_id: UUID) -> int:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .count()
    )


# ── AuditLog ──────────────────────────────────────────────────────────────────

def create_audit_log(
    db: Session,
    document_id: UUID,
    action: str,
    user: str,
    version_id: Optional[UUID] = None,
) -> AuditLog:
    log = AuditLog(
        document_id=document_id,
        action=action,
        user=user,
        version_id=version_id,
    )
    db.add(log)
    return log


def get_audit_logs(db: Session, document_id: UUID) -> list[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.document_id == document_id)
        .order_by(AuditLog.timestamp)
        .all()
    )
