"""add_soft_delete_to_document_versions

Revision ID: 9d7f6c1b2c3d
Revises: 763c4125351b
Create Date: 2026-03-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9d7f6c1b2c3d"
down_revision: Union[str, None] = "763c4125351b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "document_versions",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "document_versions",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "document_versions",
        sa.Column("deleted_by", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_document_versions_is_deleted",
        "document_versions",
        ["is_deleted"],
    )
    op.alter_column("document_versions", "is_deleted", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_document_versions_is_deleted", table_name="document_versions")
    op.drop_column("document_versions", "deleted_by")
    op.drop_column("document_versions", "deleted_at")
    op.drop_column("document_versions", "is_deleted")
