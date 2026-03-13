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

# Create the database once using your local PostgreSQL account
# Example:
# psql -U postgres -c "CREATE DATABASE legal_doc_manager;"

# Configure environment
cp .env.example .env
# Replace the placeholder password in DATABASE_URL with your real PostgreSQL credentials
# Edit .env → set DATABASE_URL to your PostgreSQL connection string

# Verify the database connection before running migrations
python test_db.py

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
| `DATABASE_URL` | `postgresql://postgres:<real-password>@localhost:5432/legal_doc_manager` | Production DB |
| `TEST_DATABASE_URL` | `postgresql+psycopg://...@localhost:5432/legal_doc_manager_test` | Test DB |
| `APP_NAME` | `Smart Legal Document Manager` | API title |
| `DEBUG` | `False` | SQLAlchemy echo mode |
| `API_URL` | `http://localhost:8000/documents` | CLI backend URL |

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

# Create the database once using your local PostgreSQL account
# Example:
# psql -U postgres -c "CREATE DATABASE legal_doc_manager;"

# Configure environment
cp .env.example .env
# Replace the placeholder password in DATABASE_URL with your real PostgreSQL credentials
# Edit .env → set DATABASE_URL to your PostgreSQL connection string

# Verify the database connection before running migrations
python test_db.py

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev        # Development server → http://localhost:5173
npm run build      # Production build → dist/
```

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`. The checked-in example points to the local backend at `http://localhost:8000/documents`, which is required for the AI-assisted comparison summary to work in a fresh clone.

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
| `DATABASE_URL` | `postgresql://postgres:<real-password>@localhost:5432/legal_doc_manager` | Production DB |
| `TEST_DATABASE_URL` | `postgresql+psycopg://...@localhost:5432/legal_doc_manager_test` | Test DB |
| `APP_NAME` | `Smart Legal Document Manager` | API title |
| `DEBUG` | `False` | SQLAlchemy echo mode |
| `API_URL` | `http://localhost:8000/documents` | CLI backend URL |
| `VITE_API_BASE_URL` | `http://localhost:8000/documents` | Frontend backend URL |

---

## Future Scope / Considerations

While the document comparison logic is robust for production use cases involving standard legal documents, there are a few edge cases scoped for future enhancements:

1. **Large Document Processing**: The current `difflib.SequenceMatcher` algorithm runs synchronously and has an arbitrary worst-case time complexity of O(N²). For extremely large text uploads (e.g. 50MB+), this could temporarily block the FastAPI event loop. Future iterations should offload the diff calculation to a background worker (e.g., Celery) or an `asyncio` thread to prevent potential service degradation.
2. **Specialised Diff Edge Cases**: The diff parser relies on filtering out `+++` and `---` git-style header strings. If a user's original legal document contains a line strictly starting with `+++ ` (e.g., a stylized "+++ Appendix A"), it may currently be excluded from the summarized `added` arrays, though it will remain untouched in the raw diff viewer. Future parser improvements should employ stronger regex to isolate difflib headers without affecting document content.

### Roadmap for Enterprise Legal Tech Features

To elevate this project to a truly comprehensive, production-ready legal tech product, we have identified the following high-impact features for the roadmap:

*   **OCR and Document Scanning (Tesseract/Textract)**: Integrate OCR capabilities to extract text from scanned PDFs or images of physical contracts, turning them into trackable digital versions.
*   **Document Approval Workflows & E-Signatures**: Implement status lifecycles (Draft, Approved, Sent to Client, Executed) and integrations with e-signature APIs (like DocuSign or SignWell).
*   **Role-Based Access Control (RBAC) & Ethical Walls**: Introduce granular permissions (Admin, Partner, Associate) and restrict access to documents via case-based "Matters" to prevent improper visibility (conflict of interest walls).
*   **Line-Level Collaborative Commenting**: Allow lawyers to click specific lines in the diff viewer and leave collaborative questions or legal remarks.
*   **Sync with Word "Track Changes" (Redlines)**: Support downloading a `.docx` file where the diffs are converted into Microsoft Word's native "Track Changes" format—the standard for sending redlines to opposing counsel.
*   **Clause Library Configuration**: A distinct repository for standardized, approved legal clauses (e.g., standard NDAs, Severability clauses) allowing lawyers to assemble version 1 documents dynamically.
*   **Advanced Security & Compliance**: Implement end-to-end database content encryption (e.g., via Fernet) and UI-based PDF watermarking ("CONFIDENTIAL - Prepared for X") to handle highly sensitive PII and minimize leakage risks.
