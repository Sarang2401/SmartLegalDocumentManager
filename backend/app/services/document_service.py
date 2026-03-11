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


LEGAL_TOPIC_KEYWORDS = {
    "Payment": ("payment", "fee", "fees", "invoice", "compensation"),
    "Liability": ("liability", "damages", "limitation of liability", "cap"),
    "Termination": ("termination", "terminate", "survival", "notice"),
    "Confidentiality": ("confidential", "confidentiality", "non-disclosure", "nda"),
    "Indemnity": ("indemnity", "indemnify", "hold harmless"),
    "Warranty": ("warranty", "warrant", "disclaimer"),
    "Data Protection": ("privacy", "personal data", "data protection", "security"),
    "Governing Law": ("governing law", "jurisdiction", "venue", "arbitration"),
}


def _normalise(text: str) -> str:
    """Strip whitespace so identical-content check ignores spacing."""
    return " ".join(text.split())


def _similarity(a: str, b: str) -> float:
    """Return SequenceMatcher ratio between two strings."""
    import difflib

    return difflib.SequenceMatcher(None, a, b).ratio()


def _notify(document_id: UUID, version_number: int, similarity: float) -> None:
    """Placeholder notification that keeps the demo dependency-free."""
    print(
        f"[NOTIFICATION] Document {document_id}: version v{version_number} "
        f"uploaded. Similarity to previous = {similarity:.2%} - significant change detected."
    )


def _clean_changed_line(line: str) -> str:
    """Remove diff prefixes and collapse whitespace for summaries."""
    if line[:1] in {"+", "-"}:
        line = line[1:]
    return " ".join(line.split())


def _truncate(text: str, limit: int = 140) -> str:
    """Trim long snippets so summary bullets stay readable."""
    if len(text) <= limit:
        return text
    return f"{text[: limit - 3].rstrip()}..."


def _detect_legal_topics(lines: list[str]) -> list[str]:
    """Infer likely clause topics from changed lines."""
    haystack = " ".join(lines).lower()
    topics: list[str] = []
    for topic, keywords in LEGAL_TOPIC_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            topics.append(topic)
    return topics


def _review_guidance(similarity: float, legal_topics: list[str], change_count: int) -> str:
    """Return a lawyer-focused review suggestion."""
    if legal_topics:
        topics = ", ".join(legal_topics[:3]).lower()
        return f"Review the updated {topics} language before sharing this draft externally."
    if similarity < 0.85 or change_count >= 6:
        return "Review the full redline carefully; multiple clauses appear to have changed materially."
    if change_count == 0:
        return "No additional legal review appears necessary because no textual changes were detected."
    return "A focused review should be enough because the edits appear limited in scope."


def _build_change_summary(
    version_a: int,
    version_b: int,
    similarity: float,
    added: list[str],
    removed: list[str],
) -> dict:
    """Generate a minimal AI-style summary without external dependencies."""
    cleaned_added = [_clean_changed_line(line) for line in added]
    cleaned_removed = [_clean_changed_line(line) for line in removed]
    cleaned_added = [line for line in cleaned_added if line]
    cleaned_removed = [line for line in cleaned_removed if line]
    changed_lines = cleaned_added + cleaned_removed
    legal_topics = _detect_legal_topics(changed_lines)
    target_label = f"v{version_b}" if version_b > 0 else "the proposed draft"

    if not changed_lines and similarity == 1:
        overview = f"{target_label} matches v{version_a}; no textual changes were detected."
        notable_changes = ["No additions or removals were identified in the comparison."]
    else:
        if similarity >= 0.98:
            change_level = "minor targeted edits"
        elif similarity >= 0.85:
            change_level = "moderate edits"
        else:
            change_level = "material edits"

        overview = (
            f"Compared with v{version_a}, {target_label} contains {change_level}: "
            f"{len(added)} added and {len(removed)} removed lines. "
            f"Overall similarity is {similarity * 100:.1f}%."
        )

        notable_changes: list[str] = []
        if cleaned_added:
            notable_changes.append(f"Added: {_truncate(cleaned_added[0])}")
        if cleaned_removed:
            notable_changes.append(f"Removed: {_truncate(cleaned_removed[0])}")
        if legal_topics:
            notable_changes.append(f"Potentially affected legal areas: {', '.join(legal_topics[:4])}.")
        if len(changed_lines) > 2:
            notable_changes.append(
                f"Additional changed text appears in {len(changed_lines) - 2} other line(s) of the redline."
            )

    return {
        "overview": overview,
        "notable_changes": notable_changes,
        "legal_topics": legal_topics,
        "review_guidance": _review_guidance(similarity, legal_topics, len(changed_lines)),
    }


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


def list_documents(db: Session) -> list[Document]:
    """Retrieve a list of all active documents."""
    return repo.get_all_documents(db)


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


def compare_versions(db: Session, document_id: UUID, v1: int, v2: int) -> dict:
    """Compare two versions of a document using difflib."""
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

    diff_lines = list(
        difflib.unified_diff(lines_a, lines_b, fromfile=f"v{v1}", tofile=f"v{v2}")
    )

    added = [line.rstrip("\n") for line in diff_lines if line.startswith("+") and not line.startswith("+++")]
    removed = [line.rstrip("\n") for line in diff_lines if line.startswith("-") and not line.startswith("---")]
    ratio = difflib.SequenceMatcher(None, ver_a.content, ver_b.content).ratio()
    summary = _build_change_summary(v1, v2, ratio, added, removed)

    return {
        "document_id": str(document_id),
        "version_a": v1,
        "version_b": v2,
        "similarity": round(ratio, 4),
        "diff": [line.rstrip("\n") for line in diff_lines],
        "added": added,
        "removed": removed,
        "summary": summary,
    }


def restore_version(
    db: Session,
    document_id: UUID,
    version_number: int,
    restored_by: str,
    background_tasks: BackgroundTasks,
) -> DocumentVersion:
    """Restore a previous version by creating a new version with its content."""
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    ver_to_restore = repo.get_version_by_number(db, document_id, version_number)
    if ver_to_restore is None:
        raise ValueError(f"Version {version_number} not found.")

    latest = repo.get_latest_version(db, document_id)
    if latest and _normalise(latest.content) == _normalise(ver_to_restore.content):
        raise ValueError("Cannot restore: current latest version already matches the selected version.")

    next_number = (latest.version_number + 1) if latest else 1
    new_version = repo.create_version(
        db,
        document_id=document_id,
        version_number=next_number,
        content=ver_to_restore.content,
        created_by=restored_by,
    )

    repo.create_audit_log(
        db,
        document_id=document_id,
        action="RESTORE_VERSION",
        user=restored_by,
        version_id=new_version.id,
    )

    db.commit()
    db.refresh(new_version)

    if latest:
        ratio = _similarity(latest.content, new_version.content)
        if ratio < 0.98:
            background_tasks.add_task(_notify, document_id, new_version.version_number, ratio)

    return new_version


def preview_diff(db: Session, document_id: UUID, content: str) -> dict:
    """Preview the diff of new content against the latest version without saving."""
    import difflib

    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    latest = repo.get_latest_version(db, document_id)
    if not latest:
        raise ValueError("No versions found to compare against.")

    lines_a = latest.content.splitlines(keepends=True)
    lines_b = content.splitlines(keepends=True)

    diff_lines = list(
        difflib.unified_diff(lines_a, lines_b, fromfile=f"v{latest.version_number}", tofile="Preview")
    )

    added = [line.rstrip("\n") for line in diff_lines if line.startswith("+") and not line.startswith("+++")]
    removed = [line.rstrip("\n") for line in diff_lines if line.startswith("-") and not line.startswith("---")]
    ratio = difflib.SequenceMatcher(None, latest.content, content).ratio()
    summary = _build_change_summary(latest.version_number, -1, ratio, added, removed)

    return {
        "document_id": str(document_id),
        "version_a": latest.version_number,
        "version_b": -1,
        "similarity": round(ratio, 4),
        "diff": [line.rstrip("\n") for line in diff_lines],
        "added": added,
        "removed": removed,
        "summary": summary,
    }


def update_title(db: Session, document_id: UUID, new_title: str, modified_by: str) -> Document:
    """Update a document's title without creating a new version."""
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    doc.title = new_title
    repo.create_audit_log(
        db,
        document_id=document_id,
        action="UPDATE_TITLE",
        user=modified_by,
    )
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, document_id: UUID, modified_by: str) -> None:
    """Soft delete a document. History stays intact."""
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    doc.is_deleted = True
    repo.create_audit_log(
        db,
        document_id=document_id,
        action="DELETE_DOCUMENT",
        user=modified_by,
    )
    db.commit()


def delete_version(db: Session, document_id: UUID, version_number: int, modified_by: str) -> None:
    """Hard delete a specific version. Cannot delete the final remaining version."""
    doc = repo.get_document(db, document_id)
    if doc is None:
        raise ValueError("Document not found.")

    version_count = repo.count_versions(db, document_id)
    if version_count <= 1:
        raise ValueError("Cannot delete the final remaining version.")

    ver = repo.get_version_by_number(db, document_id, version_number)
    if ver is None:
        raise ValueError(f"Version {version_number} not found.")

    repo.create_audit_log(
        db,
        document_id=document_id,
        action="DELETE_VERSION",
        user=modified_by,
        version_id=ver.id,
    )

    db.delete(ver)
    db.commit()


def fetch_timeline(db: Session, document_id: UUID) -> list:
    """Fetch chronological activity timeline for a document."""
    doc = repo.get_document(db, document_id, include_deleted=True)
    if doc is None:
        raise ValueError("Document not found.")

    return repo.get_audit_logs(db, document_id)
