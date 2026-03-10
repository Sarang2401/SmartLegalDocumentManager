"""
Unit tests for document_service business logic (PRD §11).

Tests covered:
  - Version creation: creating a document auto-creates v1
  - Diff logic: compare returns correct added / removed / similarity
  - Identical content detection: whitespace-normalised rejection
  - Metadata updates: title change does NOT create a new version
  - Document deletion: soft-delete sets is_deleted = True
  - Version deletion: prevents deletion of last remaining version
"""

import pytest
from fastapi.testclient import TestClient


# ── Helpers ────────────────────────────────────────────────────────────────────

def _create_doc(client: TestClient, title: str = "NDA Agreement", content: str = "This is version 1.", user: str = "alice") -> dict:
    res = client.post("/documents", json={"title": title, "content": content, "created_by": user})
    assert res.status_code == 201, res.text
    return res.json()


# ── 1. Version creation ────────────────────────────────────────────────────────

class TestVersionCreation:
    def test_create_document_returns_201(self, client):
        res = client.post("/documents", json={
            "title": "Service Agreement",
            "content": "Party A agrees to provide services.",
            "created_by": "alice",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Service Agreement"
        assert data["created_by"] == "alice"
        assert data["is_deleted"] is False

    def test_create_document_auto_creates_version_1(self, client):
        doc = _create_doc(client, title="Lease Agreement", content="The tenant agrees.", user="bob")
        doc_id = doc["id"]

        versions = client.get(f"/documents/{doc_id}/versions").json()
        assert len(versions) == 1
        assert versions[0]["version_number"] == 1
        assert versions[0]["content"] == "The tenant agrees."
        assert versions[0]["created_by"] == "bob"

    def test_upload_version_increments_version_number(self, client):
        doc = _create_doc(client, content="Original clause.")
        doc_id = doc["id"]

        res = client.post(f"/documents/{doc_id}/versions", json={
            "content": "Modified clause with new terms.",
            "modified_by": "carol",
        })
        assert res.status_code == 201
        assert res.json()["version_number"] == 2

    def test_audit_log_created_on_document_create(self, client):
        doc = _create_doc(client, title="Audit Log Test")
        timeline = client.get(f"/documents/{doc['id']}/timeline").json()
        actions = [log["action"] for log in timeline]
        assert "CREATE_DOCUMENT" in actions


# ── 2. Identical content detection ────────────────────────────────────────────

class TestIdenticalContentDetection:
    def test_identical_content_returns_409(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(f"/documents/{doc['id']}/versions", json={
            "content": "Clause A: All rights reserved.",
            "modified_by": "alice",
        })
        assert res.status_code == 409
        assert "No meaningful change" in res.json()["detail"]

    def test_whitespace_difference_treated_as_identical(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(f"/documents/{doc['id']}/versions", json={
            "content": "  Clause  A:   All  rights  reserved.  ",
            "modified_by": "alice",
        })
        assert res.status_code == 409

    def test_meaningful_change_is_accepted(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(f"/documents/{doc['id']}/versions", json={
            "content": "Clause A: All rights reserved. Clause B: Termination with 30 days notice.",
            "modified_by": "alice",
        })
        assert res.status_code == 201


# ── 3. Diff / compare logic ───────────────────────────────────────────────────

class TestDiffLogic:
    def test_compare_returns_similarity_and_diff(self, client):
        doc = _create_doc(client, content="Line one.\nLine two.\nLine three.")
        doc_id = doc["id"]
        client.post(f"/documents/{doc_id}/versions", json={
            "content": "Line one.\nLine two modified.\nLine three.",
            "modified_by": "bob",
        })

        res = client.get(f"/documents/{doc_id}/compare?v1=1&v2=2")
        assert res.status_code == 200
        data = res.json()
        assert 0.0 <= data["similarity"] <= 1.0
        assert isinstance(data["diff"], list)
        assert len(data["added"]) > 0
        assert len(data["removed"]) > 0

    def test_compare_identical_versions_has_similarity_1(self, client):
        doc = _create_doc(client, content="Identical content.")
        doc_id = doc["id"]
        # Force a different version with slightly different content, then check v1 vs v1
        res = client.get(f"/documents/{doc_id}/compare?v1=1&v2=1")
        assert res.status_code == 200
        assert res.json()["similarity"] == 1.0
        assert res.json()["diff"] == []

    def test_compare_invalid_version_returns_404(self, client):
        doc = _create_doc(client)
        res = client.get(f"/documents/{doc['id']}/compare?v1=1&v2=999")
        assert res.status_code == 404


# ── 4. Metadata update ────────────────────────────────────────────────────────

class TestMetadataUpdate:
    def test_update_title_does_not_create_new_version(self, client):
        doc = _create_doc(client, title="Old Title")
        doc_id = doc["id"]

        res = client.patch(f"/documents/{doc_id}/title", json={
            "title": "New Title",
            "modified_by": "alice",
        })
        assert res.status_code == 200
        assert res.json()["title"] == "New Title"

        versions = client.get(f"/documents/{doc_id}/versions").json()
        assert len(versions) == 1  # version count unchanged

    def test_update_title_creates_audit_log_entry(self, client):
        doc = _create_doc(client, title="Rename Me")
        client.patch(f"/documents/{doc['id']}/title", json={"title": "Renamed", "modified_by": "alice"})

        timeline = client.get(f"/documents/{doc['id']}/timeline").json()
        actions = [log["action"] for log in timeline]
        assert "UPDATE_TITLE" in actions


# ── 5. Document deletion ──────────────────────────────────────────────────────

class TestDocumentDeletion:
    def test_soft_delete_removes_from_list(self, client):
        doc = _create_doc(client, title="To Be Deleted")
        doc_id = doc["id"]

        res = client.delete(f"/documents/{doc_id}?modified_by=alice")
        assert res.status_code == 204

        docs = client.get("/documents").json()
        ids = [d["id"] for d in docs]
        assert doc_id not in ids

    def test_soft_delete_creates_audit_log(self, client):
        doc = _create_doc(client, title="Audit Delete Test")
        client.delete(f"/documents/{doc['id']}?modified_by=alice")

        timeline = client.get(f"/documents/{doc['id']}/timeline").json()
        # Timeline is still accessible after soft-delete via direct endpoint
        actions = [log["action"] for log in timeline]
        assert "DELETE_DOCUMENT" in actions


# ── 6. Version deletion ───────────────────────────────────────────────────────

class TestVersionDeletion:
    def test_cannot_delete_final_version(self, client):
        doc = _create_doc(client, content="Only version.")
        res = client.delete(f"/documents/{doc['id']}/versions/1?modified_by=alice")
        assert res.status_code == 400
        assert "final remaining" in res.json()["detail"]

    def test_can_delete_non_final_version(self, client):
        doc = _create_doc(client, content="Version one content.")
        doc_id = doc["id"]
        client.post(f"/documents/{doc_id}/versions", json={
            "content": "Version two content, totally different.",
            "modified_by": "alice",
        })

        res = client.delete(f"/documents/{doc_id}/versions/1?modified_by=alice")
        assert res.status_code == 204

        versions = client.get(f"/documents/{doc_id}/versions").json()
        version_numbers = [v["version_number"] for v in versions]
        assert 1 not in version_numbers
        assert 2 in version_numbers
