# Import all models so that Base.metadata is fully populated for
# Alembic autogenerate and SQLAlchemy relationship resolution.
from app.models.document import Document  # noqa: F401
from app.models.document_version import DocumentVersion  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
