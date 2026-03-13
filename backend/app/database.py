from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings
from app.db_url import normalize_database_url

# Ensure the URL uses psycopg3 dialect (postgresql+psycopg://)
_db_url = normalize_database_url(settings.DATABASE_URL)

# SQLAlchemy engine
engine = create_engine(_db_url, echo=settings.DEBUG)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
