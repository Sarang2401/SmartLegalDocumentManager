# Smart Legal Document Manager

A production-grade system for legal teams to manage document versions with full traceability. Every modification is recorded with a timestamp and user — document history is never overwritten.

---

## Architecture

```
React Dashboard (Vite + TypeScript)
        |
        | REST API (HTTP/JSON)
        v
FastAPI Backend (Python)
        |
   Service Layer   ←  Business logic, difflib, notifications
        |
 Repository Layer  ←  SQLAlchemy queries only
        |
 PostgreSQL Database
        |
 Background Notification Worker  ←  FastAPI BackgroundTasks
```

The CLI tool (`cli.py`) communicates with the same REST API used by the dashboard. No separate code path exists for CLI vs. web.

---

## Database Schema

### `documents`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `title` | VARCHAR(512) | Document name |
| `created_by` | VARCHAR(255) | Author username |
| `created_at` | TIMESTAMP | Immutable |
| `updated_at` | TIMESTAMP | Auto-updated |
| `is_deleted` | BOOLEAN | Soft-delete flag |

### `document_versions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `document_id` | UUID (FK → documents) | |
| `version_number` | INTEGER | Monotonically increasing |
| `content` | TEXT | Immutable once stored |
| `created_by` | VARCHAR(255) | Uploader username |
| `created_at` | TIMESTAMP | Immutable |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `document_id` | UUID (FK) | |
| `version_id` | UUID (FK, nullable) | |
| `action` | VARCHAR(64) | See actions below |
| `user` | VARCHAR(255) | |
| `timestamp` | TIMESTAMP | |

**Actions:** `CREATE_DOCUMENT`, `CREATE_VERSION`, `UPDATE_TITLE`, `DELETE_DOCUMENT`, `DELETE_VERSION`, `RESTORE_VERSION`

---

## Diff Algorithm

The system uses Python's built-in `difflib` module — no external dependencies.

1. **Identical content check** — before accepting an upload, content is whitespace-normalised (`" ".join(text.split())`) and compared to the latest version. If identical, the upload is rejected with HTTP 409.

2. **Version comparison** — `difflib.unified_diff()` produces line-by-line diff output. Added lines are prefixed `+`, removed lines are prefixed `-`.

3. **Similarity score** — `difflib.SequenceMatcher(None, a, b).ratio()` returns a float 0–1. Scores below 0.98 trigger a background notification.

---

## REST API

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/documents` | List all active documents |
| `POST` | `/documents` | Create document + version 1 |
| `POST` | `/documents/{id}/versions` | Upload new version |
| `GET` | `/documents/{id}/versions` | List all versions |
| `GET` | `/documents/{id}/compare?v1=1&v2=2` | Compare two versions |
| `PATCH` | `/documents/{id}/title` | Update title (no new version) |
| `DELETE` | `/documents/{id}?modified_by=` | Soft-delete document |
| `DELETE` | `/documents/{id}/versions/{n}?modified_by=` | Delete specific version |
| `GET` | `/documents/{id}/timeline` | Fetch audit log timeline |
| `POST` | `/documents/{id}/restore/{n}` | Restore an old version |
| `POST` | `/documents/{id}/preview` | Preview diff before uploading |
| `GET` | `/health` | Health check |

Full interactive docs: `http://localhost:8000/docs`

---

## CLI Usage

The CLI requires the backend to be running.

```bash
# Create a document (content can be a string or a path to a .txt file)
python cli.py create-document "NDA Agreement" "This agreement is entered into..." alice

# Upload a new version from a file
python cli.py upload-version <doc-uuid> ./v2_nda.txt bob

# Compare two versions (colour-coded output)
python cli.py compare <doc-uuid> 1 2

# View full activity timeline
python cli.py history <doc-uuid>
```

Set `API_URL` environment variable to point the CLI at a non-default backend:

```bash
API_URL=https://my-backend.example.com/documents python cli.py history <doc-uuid>
```

---

## Setup & Deployment

> **Are you evaluating or testing this project?** Please see our comprehensive [Testing & Evaluation Guide](TESTING_GUIDE.md) for step-by-step instructions on setting up from scratch and exploring both the CLI and Web Dashboard.

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Node.js 18+

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env → set DATABASE_URL to your PostgreSQL connection string

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Development server → http://localhost:5173
npm run build      # Production build → dist/
```

### Running Tests

A separate PostgreSQL database is required for tests. Create it first:

```sql
CREATE DATABASE legal_doc_manager_test;
```

Then run:

```bash
cd backend
# Optionally set a custom test DB URL:
# export TEST_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/legal_doc_manager_test

python -m pytest tests/ -v
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://...@localhost:5432/legal_doc_manager` | Production DB |
| `TEST_DATABASE_URL` | `postgresql+psycopg://...@localhost:5432/legal_doc_manager_test` | Test DB |
| `APP_NAME` | `Smart Legal Document Manager` | API title |
| `DEBUG` | `False` | SQLAlchemy echo mode |
| `API_URL` | `http://localhost:8000/documents` | CLI backend URL |
