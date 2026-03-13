from urllib.parse import urlsplit


_PLACEHOLDER_PASSWORDS = frozenset(
    {
        "password",
        "your_password",
        "your-password",
        "your_actual_password",
        "changeme",
        "replace_me",
        "<password>",
        "<your-password>",
    }
)


def normalize_database_url(database_url: str) -> str:
    """Convert SQLAlchemy URLs to the psycopg3 dialect when needed."""
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def psycopg_database_url(database_url: str) -> str:
    """Convert SQLAlchemy psycopg URLs back to a plain psycopg DSN."""
    if database_url.startswith("postgresql+psycopg://"):
        return database_url.replace("postgresql+psycopg://", "postgresql://", 1)
    return database_url


def uses_placeholder_password(database_url: str) -> bool:
    """Detect copied example credentials that were never replaced."""
    parsed = urlsplit(database_url)
    if not parsed.scheme.startswith("postgresql"):
        return False
    return (parsed.password or "").lower() in _PLACEHOLDER_PASSWORDS


def placeholder_password_error(env_path: str = ".env") -> str:
    return (
        f"DATABASE_URL in {env_path} still uses a placeholder PostgreSQL password. "
        "Replace it with your real local credentials and rerun the command. "
        "Example: postgresql://postgres:<your-real-password>@localhost:5432/legal_doc_manager"
    )
