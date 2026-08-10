"""Jira Cloud REST client for WorkBridge."""

from __future__ import annotations

import base64
import os
from typing import Any

import requests

DEFAULT_BASE_URL = "https://ganeshsnawali.atlassian.net"


def _base_url() -> str:
    return os.environ.get("JIRA_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def _headers() -> dict[str, str]:
    email = os.environ.get("JIRA_EMAIL")
    token = os.environ.get("JIRA_API_TOKEN")
    if not email or not token:
        raise RuntimeError("JIRA_EMAIL and JIRA_API_TOKEN must be set")

    basic = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {basic}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def jira_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{_base_url()}{path}"
    response = requests.get(
        url,
        headers=_headers(),
        params=params or {},
        timeout=20,
    )
    if not response.ok:
        raise RuntimeError(
            f"Jira GET {path} failed ({response.status_code}): {response.text}"
        )
    return response.json()


def jira_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    url = f"{_base_url()}{path}"
    response = requests.post(
        url,
        headers=_headers(),
        json=body,
        timeout=20,
    )
    if not response.ok:
        raise RuntimeError(
            f"Jira POST {path} failed ({response.status_code}): {response.text}"
        )
    return response.json()


def search_issues(
    jql: str,
    fields: list[str],
    max_results: int = 50,
) -> dict[str, Any]:
    """Search issues; prefer enhanced JQL endpoint, fall back to classic search."""
    body = {
        "jql": jql,
        "maxResults": max_results,
        "fields": fields,
    }
    try:
        return jira_post("/rest/api/3/search/jql", body)
    except RuntimeError as exc:
        message = str(exc)
        if "404" in message or "410" in message or "not found" in message.lower():
            return jira_post("/rest/api/3/search", body)
        raise
