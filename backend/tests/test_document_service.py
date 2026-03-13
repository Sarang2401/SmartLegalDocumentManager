"""
Unit tests for document_service business logic.
"""

from datetime import datetime

from fastapi.testclient import TestClient


def _create_doc(
    client: TestClient,
    title: str = "NDA Agreement",
    content: str = "This is version 1.",
    user: str = "alice",
) -> dict:
    res = client.post("/documents", json={"title": title, "content": content, "created_by": user})
    assert res.status_code == 201, res.text
    return res.json()


class TestHealthRoutes:
    def test_root_supports_head_requests(self, client):
        res = client.head("/")
        assert res.status_code == 200

    def test_health_check_returns_healthy(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"


class TestVersionCreation:
    def test_create_document_returns_201(self, client):
        res = client.post(
            "/documents",
            json={
                "title": "Service Agreement",
                "content": "Party A agrees to provide services.",
                "created_by": "alice",
            },
        )
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

        res = client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Modified clause with new terms.",
                "modified_by": "carol",
            },
        )
        assert res.status_code == 201
        assert res.json()["version_number"] == 2

    def test_audit_log_created_on_document_create(self, client):
        doc = _create_doc(client, title="Audit Log Test")
        timeline = client.get(f"/documents/{doc['id']}/timeline").json()
        actions = [log["action"] for log in timeline]
        assert "CREATE_DOCUMENT" in actions

    def test_upload_version_updates_document_activity_timestamp(self, client):
        doc = _create_doc(client, title="Timestamp Check", content="Initial draft.")
        initial_updated_at = datetime.fromisoformat(doc["updated_at"])

        res = client.post(
            f"/documents/{doc['id']}/versions",
            json={
                "content": "Initial draft with a new payment clause.",
                "modified_by": "carol",
            },
        )
        assert res.status_code == 201

        docs = client.get("/documents").json()
        updated_doc = next(d for d in docs if d["id"] == doc["id"])
        assert datetime.fromisoformat(updated_doc["updated_at"]) > initial_updated_at


class TestIdenticalContentDetection:
    def test_identical_content_returns_409(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(
            f"/documents/{doc['id']}/versions",
            json={
                "content": "Clause A: All rights reserved.",
                "modified_by": "alice",
            },
        )
        assert res.status_code == 409
        assert "No meaningful change" in res.json()["detail"]

    def test_whitespace_difference_treated_as_identical(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(
            f"/documents/{doc['id']}/versions",
            json={
                "content": "  Clause  A:   All  rights  reserved.  ",
                "modified_by": "alice",
            },
        )
        assert res.status_code == 409

    def test_meaningful_change_is_accepted(self, client):
        doc = _create_doc(client, content="Clause A: All rights reserved.")
        res = client.post(
            f"/documents/{doc['id']}/versions",
            json={
                "content": "Clause A: All rights reserved. Clause B: Termination with 30 days notice.",
                "modified_by": "alice",
            },
        )
        assert res.status_code == 201


class TestDiffLogic:
    def test_compare_returns_similarity_and_diff(self, client):
        doc = _create_doc(client, content="Line one.\nLine two.\nLine three.")
        doc_id = doc["id"]
        client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Line one.\nLine two modified.\nLine three.",
                "modified_by": "bob",
            },
        )

        res = client.get(f"/documents/{doc_id}/compare?v1=1&v2=2")
        assert res.status_code == 200
        data = res.json()
        assert 0.0 <= data["similarity"] <= 1.0
        assert isinstance(data["diff"], list)
        assert len(data["added"]) > 0
        assert len(data["removed"]) > 0
        assert "summary" in data
        assert data["summary"]["overview"]
        assert isinstance(data["summary"]["notable_changes"], list)
        assert isinstance(data["summary"]["legal_topics"], list)
        assert data["summary"]["review_guidance"]

    def test_compare_identical_versions_has_similarity_1(self, client):
        doc = _create_doc(client, content="Identical content.")
        doc_id = doc["id"]
        res = client.get(f"/documents/{doc_id}/compare?v1=1&v2=1")
        assert res.status_code == 200
        assert res.json()["similarity"] == 1.0
        assert res.json()["diff"] == []
        assert "no textual changes" in res.json()["summary"]["overview"].lower()

    def test_compare_invalid_version_returns_404(self, client):
        doc = _create_doc(client)
        res = client.get(f"/documents/{doc['id']}/compare?v1=1&v2=999")
        assert res.status_code == 404

    def test_compare_summary_flags_legal_topics(self, client):
        doc = _create_doc(client, content="Supplier shall deliver services.")
        doc_id = doc["id"]
        client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": (
                    "Supplier shall deliver services.\n"
                    "Client may terminate on 30 days notice.\n"
                    "Payment is due within 15 days of invoice."
                ),
                "modified_by": "bob",
            },
        )

        res = client.get(f"/documents/{doc_id}/compare?v1=1&v2=2")
        assert res.status_code == 200
        summary = res.json()["summary"]
        assert "Payment" in summary["legal_topics"]
        assert "Termination" in summary["legal_topics"]


class TestMetadataUpdate:
    def test_update_title_does_not_create_new_version(self, client):
        doc = _create_doc(client, title="Old Title")
        doc_id = doc["id"]

        res = client.patch(
            f"/documents/{doc_id}/title",
            json={
                "title": "New Title",
                "modified_by": "alice",
            },
        )
        assert res.status_code == 200
        assert res.json()["title"] == "New Title"

        versions = client.get(f"/documents/{doc_id}/versions").json()
        assert len(versions) == 1

    def test_update_title_creates_audit_log_entry(self, client):
        doc = _create_doc(client, title="Rename Me")
        client.patch(f"/documents/{doc['id']}/title", json={"title": "Renamed", "modified_by": "alice"})

        timeline = client.get(f"/documents/{doc['id']}/timeline").json()
        actions = [log["action"] for log in timeline]
        assert "UPDATE_TITLE" in actions


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
        actions = [log["action"] for log in timeline]
        assert "DELETE_DOCUMENT" in actions


class TestVersionDeletion:
    def test_cannot_delete_final_version(self, client):
        doc = _create_doc(client, content="Only version.")
        res = client.delete(f"/documents/{doc['id']}/versions/1?modified_by=alice")
        assert res.status_code == 400
        assert "final remaining" in res.json()["detail"]

    def test_can_delete_non_final_version(self, client):
        doc = _create_doc(client, content="Version one content.")
        doc_id = doc["id"]
        client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Version two content, totally different.",
                "modified_by": "alice",
            },
        )

        res = client.delete(f"/documents/{doc_id}/versions/1?modified_by=alice")
        assert res.status_code == 204

        versions = client.get(f"/documents/{doc_id}/versions").json()
        version_numbers = [v["version_number"] for v in versions]
        assert 1 not in version_numbers
        assert 2 in version_numbers

        timeline = client.get(f"/documents/{doc_id}/timeline").json()
        delete_logs = [log for log in timeline if log["action"] == "DELETE_VERSION"]
        assert delete_logs
        assert delete_logs[-1]["version_id"] is not None

    def test_delete_version_updates_document_activity_timestamp(self, client):
        doc = _create_doc(client, content="Version one content.")
        doc_id = doc["id"]
        client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Version two content, totally different.",
                "modified_by": "alice",
            },
        )
        docs_before_delete = client.get("/documents").json()
        before_delete = next(d for d in docs_before_delete if d["id"] == doc_id)
        before_timestamp = datetime.fromisoformat(before_delete["updated_at"])

        res = client.delete(f"/documents/{doc_id}/versions/1?modified_by=alice")
        assert res.status_code == 204

        docs_after_delete = client.get("/documents").json()
        after_delete = next(d for d in docs_after_delete if d["id"] == doc_id)
        assert datetime.fromisoformat(after_delete["updated_at"]) > before_timestamp

    def test_version_numbers_remain_monotonic_after_soft_delete(self, client):
        doc = _create_doc(client, content="Version one content.")
        doc_id = doc["id"]
        second = client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Version two content.",
                "modified_by": "alice",
            },
        )
        assert second.status_code == 201
        assert second.json()["version_number"] == 2

        delete_res = client.delete(f"/documents/{doc_id}/versions/2?modified_by=alice")
        assert delete_res.status_code == 204

        third = client.post(
            f"/documents/{doc_id}/versions",
            json={
                "content": "Version three content.",
                "modified_by": "alice",
            },
        )
        assert third.status_code == 201
        assert third.json()["version_number"] == 3
