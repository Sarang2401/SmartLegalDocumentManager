#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
from urllib.error import HTTPError

API_URL = os.getenv("API_URL", "http://localhost:8000/documents")

def _request(method, url, data=None):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else None
    except HTTPError as e:
        error_msg = e.read().decode("utf-8")
        print(f"Error {e.code}: {error_msg}")
        sys.exit(1)
    except Exception as e:
        print(f"Connection Error: {e}. Is the server running at {API_URL}?")
        sys.exit(1)

def _get_content(source: str) -> str:
    """Read from file if path exists, otherwise treat as literal string."""
    if os.path.isfile(source):
        with open(source, "r", encoding="utf-8") as f:
            return f.read()
    return source

def create_document(args):
    content = _get_content(args.content)
    payload = {
        "title": args.title,
        "content": content,
        "created_by": args.user
    }
    res = _request("POST", API_URL, payload)
    print("Document Created:")
    print(json.dumps(res, indent=2))

def upload_version(args):
    content = _get_content(args.content)
    payload = {
        "content": content,
        "modified_by": args.user
    }
    url = f"{API_URL}/{args.doc_id}/versions"
    res = _request("POST", url, payload)
    print("Version Uploaded:")
    print(json.dumps(res, indent=2))

def compare(args):
    url = f"{API_URL}/{args.doc_id}/compare?v1={args.v1}&v2={args.v2}"
    res = _request("GET", url)
    print(f"Comparing v{res.get('version_a')} and v{res.get('version_b')} for doc {res.get('document_id')}")
    print(f"Similarity: {res.get('similarity', 0)}")
    print("-" * 40)
    for line in res.get("diff", []):
        print(line)
    print("-" * 40)

def history(args):
    url = f"{API_URL}/{args.doc_id}/timeline"
    logs = _request("GET", url)
    print(f"History for {args.doc_id}:")
    for log in logs:
        vid = f" (version: {log.get('version_id')})" if log.get('version_id') else ""
        print(f"[{log['timestamp']}] {log['action']} by {log['user']}{vid}")

def main():
    parser = argparse.ArgumentParser(description="Smart Legal Document Manager CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # create-document
    p_create = subparsers.add_parser("create-document", help="Create a new document")
    p_create.add_argument("title", help="Document title")
    p_create.add_argument("content", help="Initial content (string or path to text file)")
    p_create.add_argument("user", help="User creating the document")
    p_create.set_defaults(func=create_document)

    # upload-version
    p_upload = subparsers.add_parser("upload-version", help="Upload a new version to an existing document")
    p_upload.add_argument("doc_id", help="Document UUID")
    p_upload.add_argument("content", help="New content (string or path to text file)")
    p_upload.add_argument("user", help="User modifying the document")
    p_upload.set_defaults(func=upload_version)

    # compare
    p_compare = subparsers.add_parser("compare", help="Compare two versions of a document")
    p_compare.add_argument("doc_id", help="Document UUID")
    p_compare.add_argument("v1", type=int, help="Version 1 number")
    p_compare.add_argument("v2", type=int, help="Version 2 number")
    p_compare.set_defaults(func=compare)

    # history
    p_hist = subparsers.add_parser("history", help="Show document action timeline (audit logs)")
    p_hist.add_argument("doc_id", help="Document UUID")
    p_hist.set_defaults(func=history)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
