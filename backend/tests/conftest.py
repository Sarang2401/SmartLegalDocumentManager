"""
Test configuration and fixtures.

Uses a dedicated PostgreSQL test database so the production database is
never touched.  Set TEST_DATABASE_URL in your environment (or .env) to
override the default connection string.

Each test runs inside a savepoint that is rolled back after completion,
keeping the DB clean without dropping and recreating tables between tests.
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database import Base, get_db
from app.main import app

# ── Connection string ──────────────────────────────────────────────────────────

_DEFAULT_TEST_URL = (
    "postgresql+psycopg://defnix:defnix_dev@localhost:5433/defnix"
)
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", _DEFAULT_TEST_URL)

# ── Engine & session factory ───────────────────────────────────────────────────

test_engine = create_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# ── Session-scoped setup / teardown ───────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once before the test session; drop them afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


# ── Per-test transaction fixture ──────────────────────────────────────────────

@pytest.fixture()
def db() -> Session:
    """
    Yield a DB session wrapped in a nested transaction (savepoint).
    The savepoint is rolled back after each test, leaving the DB clean.
    """
    connection = test_engine.connect()
    # Begin an outer transaction so we can roll it back at the end
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Nested savepoint — service layer commits will only flush up to here
    connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ── FastAPI test client ────────────────────────────────────────────────────────

@pytest.fixture()
def client(db: Session) -> TestClient:
    """TestClient with the DB dependency overridden to the test session."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
