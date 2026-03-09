"""Business logic for document management.

This layer sits between routes and the repository. It enforces rules like
preventing identical version uploads and triggering background notifications.
"""

from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.repositories import document_repository as repo


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalise(text: str) -> str:
    """Strip whitespace so identical-content check ignores spacing."""
    return " ".join(text.split())


def _similarity(a: str, b: str) -> float:
    """Return SequenceMatcher ratio between two strings."""
    import difflib
    return difflib.SequenceMatcher(None, a, b).ratio()


def _notify(document_id: UUID, version_number: int, similarity: float) -> None:
    """Placeholder notification — prints to stdout (no external deps allowed)."""
    print(
        f"[NOTIFICATION] Document {document_id}: version v{version_number} "
        f"uploaded. Similarity to previous = {similarity:.2%} — significant change detected."
    )


# ── Service functions ─────────────────────────────────────────────────────────

def create_document(
    db: Session,
    title: str,
    content: str,
    created_by: str,
) -> tuple[Document, DocumentVersion]:
    """Create a document and its first version atomically."""
    doc = repo.create_document(db, title=title, created_by=created_by)

    version = repo.create_version(
        db,
        document_id=doc.id,
        version_number=1,
        content=content,
        created_by=created_by,
    )

    repo.create_audit_log(
        db,
        document_id=doc.id,
        action="CREATE_DOCUMENT",
        user=created_by,
        version_id=version.id,
    )

    db.commit()
    db.refresh(doc)
    db.refresh(version)
    return doc, version


def upload_version(
    db: Session,
    document_id: UUID,
    content: str,
    modified_by: str,
    background_tasks: BackgroundTasks,
) -> DocumentVersion:
    """
    Upload a new version for an existing document.

    Raises ValueError if:
    - Document not found.
    - Content is identical to the latest version (whitespace-normalised).
    """
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    latest = repo.get_latest_version(db, document_id)
    if latest and _normalise(latest.content) == _normalise(content):
        raise ValueError("No meaningful change detected.")

    next_number = (latest.version_number + 1) if latest else 1
    version = repo.create_version(
        db,
        document_id=document_id,
        version_number=next_number,
        content=content,
        created_by=modified_by,
    )

    repo.create_audit_log(
        db,
        document_id=document_id,
        action="CREATE_VERSION",
        user=modified_by,
        version_id=version.id,
    )

    db.commit()
    db.refresh(version)

    # Background notification if change is significant
    if latest:
        ratio = _similarity(latest.content, content)
        if ratio < 0.98:
            background_tasks.add_task(_notify, document_id, version.version_number, ratio)

    return version


def list_versions(db: Session, document_id: UUID) -> list[DocumentVersion]:
    """Return all versions for a document, ordered by version number."""
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")
    return repo.get_versions(db, document_id)


def compare_versions(
    db: Session, document_id: UUID, v1: int, v2: int
) -> dict:
    """Compare two versions of a document using difflib.

    Returns a dict with similarity ratio, unified diff lines, and
    categorised added / removed / modified lines.

    Raises ValueError when document or either version is not found.
    """
    import difflib

    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    ver_a = repo.get_version_by_number(db, document_id, v1)
    ver_b = repo.get_version_by_number(db, document_id, v2)
    if ver_a is None:
        raise ValueError(f"Version {v1} not found.")
    if ver_b is None:
        raise ValueError(f"Version {v2} not found.")

    lines_a = ver_a.content.splitlines(keepends=True)
    lines_b = ver_b.content.splitlines(keepends=True)

    # Unified diff output
    diff_lines = list(
        difflib.unified_diff(lines_a, lines_b, fromfile=f"v{v1}", tofile=f"v{v2}")
    )

    # Categorise changes
    added = [l.rstrip("\n") for l in diff_lines if l.startswith("+") and not l.startswith("+++")]
    removed = [l.rstrip("\n") for l in diff_lines if l.startswith("-") and not l.startswith("---")]

    # Similarity ratio
    ratio = difflib.SequenceMatcher(None, ver_a.content, ver_b.content).ratio()

    return {
        "document_id": str(document_id),
        "version_a": v1,
        "version_b": v2,
        "similarity": round(ratio, 4),
        "diff": [l.rstrip("\n") for l in diff_lines],
        "added": added,
        "removed": removed,
    }
