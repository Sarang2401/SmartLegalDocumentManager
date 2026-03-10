# User Guide — Smart Legal Document Manager

A step-by-step guide for reviewers to set up, run, and test every feature. All commands are copy-paste ready.

---

## Prerequisites

| Tool | Minimum Version | Verify with |
|---|---|---|
| Python | 3.11+ | `python --version` |
| PostgreSQL | 14+ | `psql --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

---

## Step 1 — Clone the Repository

```bash
git clone <repo-url>
cd SmartLegalDocumentManager
```

---

## Step 2 — Create the PostgreSQL Database

Open a terminal and connect to PostgreSQL using your superuser:

```bash
psql -U postgres
```

> You will be prompted for the password you set during PostgreSQL installation.

Inside the `psql` shell, run:

```sql
CREATE DATABASE legal_doc_manager;
CREATE DATABASE legal_doc_manager_test;
\q
```

> **Alternative (pgAdmin GUI):** Open pgAdmin → right-click **Databases** → **Create** → **Database** → name it `legal_doc_manager` → **Save**. Repeat for `legal_doc_manager_test`.

---

## Step 3 — Set Up the Backend

```bash
cd backend

# Create a Python virtual environment
python -m venv .venv

# Activate it
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 4 — Configure Environment Variables

```bash
# Copy the example env file
copy .env.example .env
```

Open `backend/.env` in a text editor and set your PostgreSQL credentials:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/legal_doc_manager
APP_NAME=Smart Legal Document Manager
DEBUG=True
```

> Replace `YOUR_PASSWORD` with your PostgreSQL password. If your setup uses a different user, port, or host, adjust accordingly (e.g., `postgresql://myuser:mypass@localhost:5433/mydb`).

---

## Step 5 — Run Database Migrations

```bash
alembic upgrade head
```

**Expected output:**

```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> ..., initial tables
```

This creates the `documents`, `document_versions`, and `audit_logs` tables.

---

## Step 6 — Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**Verify:** Open http://localhost:8000/health in a browser.

**Expected response:**

```json
{"status": "healthy", "app": "Smart Legal Document Manager"}
```

> ⚠️ Keep this terminal running. Open new terminals for the following steps.

---

## Step 7 — Start the Frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

**Expected output:** `Local: http://localhost:5173/`

Open http://localhost:5173 in your browser to see the dashboard.

> ⚠️ Keep this terminal running too.

---

## Step 8 — Test Features via CLI

In a **third terminal**, activate the backend virtual environment:

```bash
cd backend

# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate
```

Now test each feature by copy-pasting the commands below:

### 8a. Create a Document

```bash
python cli.py create-document "NDA Agreement" "This Non-Disclosure Agreement is entered into by Party A and Party B. Party A agrees not to disclose confidential information. Termination clause: Either party may terminate with 30 days notice." Sarang
```

✅ **Expected:** Green "Document Created" output with a JSON containing `id` (UUID).

> **Copy the `id` value** — you need it for all commands below. Replace `<DOC_ID>` with it.

### 8b. Upload a New Version

```bash
python cli.py upload-version <DOC_ID> "This Non-Disclosure Agreement is entered into by Party A and Party B. Party A agrees not to disclose confidential information. Party B shall pay a penalty of 10000 USD for any breach. Termination clause: Either party may terminate with 15 days notice." Jayesh
```

✅ **Expected:** Green "Version Uploaded" with `version_number: 2`.  
✅ **Check the backend terminal** — you should see a `[NOTIFICATION]` log line because the change was significant (similarity < 98%).

### 8c. Upload Identical Content (Should Be Rejected)

```bash
python cli.py upload-version <DOC_ID> "This Non-Disclosure Agreement is entered into by Party A and Party B. Party A agrees not to disclose confidential information. Party B shall pay a penalty of 10000 USD for any breach. Termination clause: Either party may terminate with 15 days notice." Carol
```

✅ **Expected:** Red error → `Error 409: No meaningful change detected.`

### 8d. Compare Two Versions

```bash
python cli.py compare <DOC_ID> 1 2
```

✅ **Expected:** Colour-coded diff output — **green** = added lines, **red** = removed lines, plus a similarity score.

### 8e. View Document Timeline

```bash
python cli.py history <DOC_ID>
```

✅ **Expected:** Chronological audit trail:

```
[timestamp] CREATE_DOCUMENT by Sarang (version: ...)
[timestamp] CREATE_VERSION by Jayesh (version: ...)
```

---

## Step 9 — Test Features via Swagger UI

Open http://localhost:8000/docs in your browser. Click **"Try it out"** on each endpoint.

### 9a. Create a Document

- **Endpoint:** `POST /documents`
- **Body:**

```json
{
  "title": "Employment Contract",
  "content": "The employee shall work 40 hours per week. Payment terms: Monthly salary of 5000 USD. Termination requires 30 days notice.",
  "created_by": "Alice"
}
```

- ✅ **Expected:** `201` response with UUID and `is_deleted: false`

### 9b. Upload a New Version

- **Endpoint:** `POST /documents/{id}/versions` (use the `id` from 9a)
- **Body:**

```json
{
  "content": "The employee shall work 40 hours per week. Payment terms: Monthly salary of 6000 USD. Liability clause added. Termination requires 15 days notice.",
  "modified_by": "Bob"
}
```

- ✅ **Expected:** `201` with `version_number: 2`

### 9c. Upload Identical Content

- **Endpoint:** `POST /documents/{id}/versions` (same `id`)
- **Body:** Same content as 9b
- ✅ **Expected:** `409` → `"No meaningful change detected."`

### 9d. Compare Two Versions

- **Endpoint:** `GET /documents/{id}/compare?v1=1&v2=2`
- ✅ **Expected:** `200` with `diff`, `similarity`, `added`, `removed` fields

### 9e. Update Document Title (No New Version)

- **Endpoint:** `PATCH /documents/{id}/title`
- **Body:**

```json
{
  "title": "Employment Contract v2.0",
  "modified_by": "Alice"
}
```

- ✅ **Expected:** `200` with updated title. Verify `GET /documents/{id}/versions` still shows only 2 versions.

### 9f. View Timeline

- **Endpoint:** `GET /documents/{id}/timeline`
- ✅ **Expected:** `200` with ordered audit log entries including `CREATE_DOCUMENT`, `CREATE_VERSION`, `UPDATE_TITLE`

### 9g. Delete a Specific Version

- **Endpoint:** `DELETE /documents/{id}/versions/1?modified_by=Alice`
- ✅ **Expected:** `204 No Content`

### 9h. Try Deleting the Last Remaining Version

- **Endpoint:** `DELETE /documents/{id}/versions/2?modified_by=Alice`
- ✅ **Expected:** `400` → `"Cannot delete the final remaining version."`

### 9i. Soft Delete a Document

- **Endpoint:** `DELETE /documents/{id}?modified_by=Alice`
- ✅ **Expected:** `204`. Document disappears from `GET /documents` but timeline is still accessible.

### 9j. Restore a Version (Bonus Feature)

> Create a fresh document with 2 versions first, then:

- **Endpoint:** `POST /documents/{new_id}/restore/1`
- **Body:** `{"restored_by": "Alice"}`
- ✅ **Expected:** `201` — creates v3 with v1's content. Audit log shows `RESTORE_VERSION`.

### 9k. Preview Diff Before Upload (Bonus Feature)

- **Endpoint:** `POST /documents/{id}/preview`
- **Body:** `{"content": "Some completely new proposed text."}`
- ✅ **Expected:** `200` — returns diff output without actually saving a new version.

---

## Step 10 — Run Automated Unit Tests

```bash
cd backend

# Set test database URL (adjust credentials to match your PostgreSQL):
# Windows PowerShell:
$env:TEST_DATABASE_URL = "postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/legal_doc_manager_test"
# macOS / Linux:
export TEST_DATABASE_URL="postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/legal_doc_manager_test"

# Run all tests
python -m pytest tests/ -v
```

**Expected output — 13 tests pass:**

```
tests/test_document_service.py::TestVersionCreation::test_create_document_returns_201 PASSED
tests/test_document_service.py::TestVersionCreation::test_create_document_auto_creates_version_1 PASSED
tests/test_document_service.py::TestVersionCreation::test_upload_version_increments_version_number PASSED
tests/test_document_service.py::TestVersionCreation::test_audit_log_created_on_document_create PASSED
tests/test_document_service.py::TestIdenticalContentDetection::test_identical_content_returns_409 PASSED
tests/test_document_service.py::TestIdenticalContentDetection::test_whitespace_difference_treated_as_identical PASSED
tests/test_document_service.py::TestIdenticalContentDetection::test_meaningful_change_is_accepted PASSED
tests/test_document_service.py::TestDiffLogic::test_compare_returns_similarity_and_diff PASSED
tests/test_document_service.py::TestDiffLogic::test_compare_identical_versions_has_similarity_1 PASSED
tests/test_document_service.py::TestDiffLogic::test_compare_invalid_version_returns_404 PASSED
tests/test_document_service.py::TestMetadataUpdate::test_update_title_does_not_create_new_version PASSED
tests/test_document_service.py::TestMetadataUpdate::test_update_title_creates_audit_log_entry PASSED
tests/test_document_service.py::TestDocumentDeletion::test_soft_delete_removes_from_list PASSED
tests/test_document_service.py::TestDocumentDeletion::test_soft_delete_creates_audit_log PASSED
tests/test_document_service.py::TestVersionDeletion::test_cannot_delete_final_version PASSED
tests/test_document_service.py::TestVersionDeletion::test_can_delete_non_final_version PASSED
```

---

## Step 11 — Test the Frontend Dashboard

Open http://localhost:5173 in your browser and test:

| # | Action | What to Do | What to Verify |
|---|---|---|---|
| 1 | Create document | Click **"New Document"** → fill Title, Content, Created By → Submit | Document appears in the list |
| 2 | View document | Click on any document card | Detail page shows version history |
| 3 | Upload with preview | Click **"Upload Version"** → paste new content → click **"Preview Diff"** | Colour-coded diff preview appears before saving |
| 4 | Confirm upload | Click **"Confirm Upload"** in the preview modal | New version added to version history |
| 5 | Compare versions | Select 2 versions with checkboxes → click **"Compare"** | Full diff page with green (added), red (removed), similarity score |
| 6 | Risk keywords | In the compare view, use content containing words like "payment", "liability", "termination" | Keywords highlighted in yellow; "Legal Risk Keywords Detected" panel shown |
| 7 | Timeline | Click the **"Timeline"** button | Visual activity trail with colour-coded action dots |
| 8 | Edit title | Click the **pencil icon** next to the document title | Title updates without creating a new version |
| 9 | Restore version | Click **"Restore"** on an older version | New version created with that old version's content |

---

## Comparison Logic — Brief Explanation

The system uses Python's built-in `difflib` module (no external libraries).

### 1. Identical Content Detection

Before accepting an upload, content is **whitespace-normalised** using `" ".join(text.split())` — collapsing all spaces, tabs, and newlines into single spaces. If the normalised new content matches the normalised latest version, the upload is **rejected with HTTP 409**: `"No meaningful change detected."`

### 2. Line-by-Line Diff

`difflib.unified_diff()` splits both versions into lines and produces a standard unified diff:

- `+` prefix → **added** in the newer version
- `-` prefix → **removed** from the older version
- No prefix → **unchanged** context line

### 3. Similarity Scoring & Smart Notifications

`difflib.SequenceMatcher(None, text_a, text_b).ratio()` returns a float between 0.0 (completely different) and 1.0 (identical). If the ratio is **below 0.98**, the system triggers a background notification via `FastAPI BackgroundTasks` — the upload response returns instantly without waiting.

### 4. Risk Keyword Highlighting (Frontend)

Changed lines are scanned for legal risk terms (`payment`, `liability`, `termination`, `confidentiality`, `indemnity`, `penalty`). Matches are highlighted in yellow with a summary panel.
