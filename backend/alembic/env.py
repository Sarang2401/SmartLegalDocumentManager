from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ── App imports ──────────────────────────────────────────────────────────────
# Make sure DATABASE_URL is read from our settings so we don't repeat it here.
from app.config import settings
import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.database import Base

# ── Alembic config ───────────────────────────────────────────────────────────
config = context.config

# Override sqlalchemy.url with the value from our app settings
# so we have a single source of truth (the .env file).
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Escape % signs so configparser doesn't try to interpolate them
config.set_main_option("sqlalchemy.url", _db_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Autogenerate migrations from our models
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without establishing a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations with a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
