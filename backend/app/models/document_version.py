import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DocumentVersion(Base):
    """Immutable snapshot of a document's content at a point in time.
    Existing rows are never updated — only new rows are inserted."""

    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(255), nullable=True)

    # Relationships
    document = relationship("Document", back_populates="versions")
    audit_logs = relationship(
        "AuditLog",
        back_populates="version",
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentVersion doc={self.document_id} v={self.version_number}>"
        )
