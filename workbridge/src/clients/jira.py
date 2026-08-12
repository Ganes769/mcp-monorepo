"""Jira Cloud REST client for WorkBridge."""

from __future__ import annotations

import base64
import os
from typing import Any

import requests

DEFAULT_BASE_URL = "https://ganeshsnawali.atlassian.net"


def resolve_base_url(base_url: str | None = None) -> str:
    return (base_url or os.environ.get("JIRA_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")


def _headers(email: str | None = None, token: str | None = None) -> dict[str, str]:
    resolved_email = email or os.environ.get("JIRA_EMAIL")
    resolved_token = token or os.environ.get("JIRA_API_TOKEN")
    if not resolved_email or not resolved_token:
        raise RuntimeError(
            "Jira credentials required: pass X-Jira-Email / X-Jira-Api-Token "
            "or set JIRA_EMAIL and JIRA_API_TOKEN"
        )

    basic = base64.b64encode(f"{resolved_email}:{resolved_token}".encode()).decode()
    return {
        "Authorization": f"Basic {basic}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def jira_get(
    path: str,
    params: dict[str, Any] | None = None,
    email: str | None = None,
    token: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    url = f"{resolve_base_url(base_url)}{path}"
    response = requests.get(
        url,
        headers=_headers(email=email, token=token),
        params=params or {},
        timeout=20,
    )
    if not response.ok:
        raise RuntimeError(
            f"Jira GET {path} failed ({response.status_code}): {response.text}"
        )
    return response.json()


def jira_post(
    path: str,
    body: dict[str, Any],
    email: str | None = None,
    token: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    url = f"{resolve_base_url(base_url)}{path}"
    response = requests.post(
        url,
        headers=_headers(email=email, token=token),
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
    email: str | None = None,
    token: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    """Search issues; prefer enhanced JQL endpoint, fall back to classic search."""
    body = {
        "jql": jql,
        "maxResults": max_results,
        "fields": fields,
    }
    try:
        return jira_post(
            "/rest/api/3/search/jql",
            body,
            email=email,
            token=token,
            base_url=base_url,
        )
    except RuntimeError as exc:
        message = str(exc)
        if "404" in message or "410" in message or "not found" in message.lower():
            return jira_post(
                "/rest/api/3/search",
                body,
                email=email,
                token=token,
                base_url=base_url,
            )
        raise
