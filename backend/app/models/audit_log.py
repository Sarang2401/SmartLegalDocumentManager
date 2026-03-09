import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AuditLog(Base):
    """Append-only record of every action taken on a document.

    action values (from PRD):
        CREATE_DOCUMENT
        CREATE_VERSION
        UPDATE_TITLE
        DELETE_DOCUMENT
        DELETE_VERSION
        RESTORE_VERSION  (Milestone 10)
    """

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("document_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    action = Column(String(64), nullable=False)
    user = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="audit_logs")
    version = relationship("DocumentVersion", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog doc={self.document_id} action={self.action}>"
