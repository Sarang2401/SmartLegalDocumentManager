# Smart Legal Document Manager - Testing & Evaluation Guide

This guide is designed for developers, reviewers, or users who have just cloned the repository and want to evaluate the project's capabilities from both the **Command Line Interface (CLI)** and the **Web Dashboard**.

---

## 1. Initial Setup

Before testing the interfaces, you need to spin up the backend and database.

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL server (running locally and accessible)

### Step 1: Database Setup
Create a new PostgreSQL database for this project (you can use your preferred SQL client or `psql` via terminal):
```bash
# In your terminal or pgAdmin:
# Replace "postgres" and "password" with your database credentials if needed.
psql -U postgres -c "CREATE DATABASE smart_legal_db;"
psql -U postgres -d smart_legal_db -c "CREATE SCHEMA IF NOT EXISTS legal_docs;"
```

### Step 2: Backend Configuration & Start
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create the virtual environment and install dependencies
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# 3. Configure the environment variables
cp .env.example .env
# Edit `.env` and update the `DATABASE_URL` with your credentials:
# Make sure to URL-encode special characters like @ in your password (e.g., %40).
# Example: DATABASE_URL=postgresql://postgres:Sarang%402401@localhost:5433/smart_legal_db?options=-csearch_path=legal_docs

# 4. Run database migrations to create the required tables
alembic upgrade head

# 5. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*Leave this terminal running. The backend API is now live at `http://localhost:8000`.*

---

## 2. Testing via the Web Interface (Frontend)

The Web Dashboard provides a visual way to manage documents, view histories, and see color-coded diffs.

```bash
# Open a new terminal

# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

**Testing Workflow in Browser:**
1. Open `http://localhost:5173` in your web browser.
2. Click **"New Document"** in the top-right corner to upload a `.txt` file or paste legal text.
3. Once created, click on the document to view its details.
4. Use the **"Upload New Version"** button to upload a modified version of the same document.
5. You will immediately see a timeline of versions. Navigate to the **"Compare Versions"** tab to select two versions and view a line-by-line diff of what changed.

---

## 3. Testing via the Command Line Interface (CLI)

The CLI tool interacts directly with the same REST API used by the web interface. Ensure the backend is still running on port 8000.

```bash
# Open a new terminal

# 1. Navigate to the backend directory
cd backend

# 2. Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# 3. Create a new document purely from the CLI:
python cli.py create-document "Non-Disclosure Agreement" "This is the initial NDA content created for testing." tester1

# Note the Document ID (UUID) output by the command above. You'll need it for the next steps!
# Let's say the ID is "123e4567-e89b-12d3-a456-426614174000"

# 4. Upload a new version (with modified text):
# (Create a quick text file with slightly different text first)
echo "This is the initial NDA content created for testing, with some new modified clauses." > v2.txt

python cli.py upload-version <your-document-id> v2.txt tester2
# Example: python cli.py upload-version 123e4567-e89b-12d3-a456-426614174000 v2.txt tester2

# 5. Compare the two versions in the terminal to see changes:
python cli.py compare <your-document-id> 1 2

# 6. View the full audit and timeline history of this document:
python cli.py history <your-document-id>
```

When you are finished testing, you can stop the backend and frontend servers with `Ctrl+C`.
