#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
from urllib.error import HTTPError
import typer

API_URL = os.getenv("API_URL", "http://localhost:8000/documents")
app = typer.Typer(help="Smart Legal Document Manager CLI")

def _request(method: str, url: str, data: dict = None) -> dict:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else None
    except HTTPError as e:
        error_msg = e.read().decode("utf-8")
        typer.secho(f"Error {e.code}: {error_msg}", fg=typer.colors.RED)
        raise typer.Exit(1)
    except Exception as e:
        typer.secho(f"Connection Error: {e}. Is the server running at {API_URL}?", fg=typer.colors.RED)
        raise typer.Exit(1)

def _get_content(source: str) -> str:
    """Read from file if path exists, otherwise treat as literal string."""
    if os.path.isfile(source):
        with open(source, "r", encoding="utf-8") as f:
            return f.read()
    return source

@app.command()
def create_document(
    title: str = typer.Argument(..., help="Document title"),
    content: str = typer.Argument(..., help="Initial content (string or path to text file)"),
    user: str = typer.Argument(..., help="User creating the document")
):
    """Create a new document"""
    text_content = _get_content(content)
    payload = {
        "title": title,
        "content": text_content,
        "created_by": user
    }
    res = _request("POST", API_URL, payload)
    typer.secho("Document Created:", fg=typer.colors.GREEN, bold=True)
    typer.echo(json.dumps(res, indent=2))

@app.command()
def upload_version(
    doc_id: str = typer.Argument(..., help="Document UUID"),
    content: str = typer.Argument(..., help="New content (string or path to text file)"),
    user: str = typer.Argument(..., help="User modifying the document")
):
    """Upload a new version to an existing document"""
    text_content = _get_content(content)
    payload = {
        "content": text_content,
        "modified_by": user
    }
    url = f"{API_URL}/{doc_id}/versions"
    res = _request("POST", url, payload)
    typer.secho("Version Uploaded:", fg=typer.colors.GREEN, bold=True)
    typer.echo(json.dumps(res, indent=2))

@app.command()
def compare(
    doc_id: str = typer.Argument(..., help="Document UUID"),
    v1: int = typer.Argument(..., help="Version 1 number"),
    v2: int = typer.Argument(..., help="Version 2 number")
):
    """Compare two versions of a document"""
    url = f"{API_URL}/{doc_id}/compare?v1={v1}&v2={v2}"
    res = _request("GET", url)
    
    typer.secho(f"Comparing v{res.get('version_a')} and v{res.get('version_b')} for doc {res.get('document_id')}", bold=True)
    typer.secho(f"Similarity: {res.get('similarity', 0)}", fg=typer.colors.CYAN)
    typer.echo("-" * 40)
    for line in res.get("diff", []):
        if line.startswith("+"):
            typer.secho(line, fg=typer.colors.GREEN)
        elif line.startswith("-"):
            typer.secho(line, fg=typer.colors.RED)
        else:
            typer.echo(line)
    typer.echo("-" * 40)

@app.command()
def history(doc_id: str = typer.Argument(..., help="Document UUID")):
    """Show document action timeline (audit logs)"""
    url = f"{API_URL}/{doc_id}/timeline"
    logs = _request("GET", url)
    typer.secho(f"History for {doc_id}:", bold=True)
    for log in logs:
        vid = f" (version: {log.get('version_id')})" if log.get('version_id') else ""
        typer.echo(f"[{log['timestamp']}] {log['action']} by {log['user']}{vid}")

if __name__ == "__main__":
    app()

