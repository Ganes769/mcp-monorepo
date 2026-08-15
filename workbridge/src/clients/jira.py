"""Jira Cloud REST client — OAuth (Atlassian 3LO) first, then request headers."""

from __future__ import annotations

import base64
import os
import time
from typing import Any

import requests

from src.api._jira_auth import credentials_from_event
from src.clients import oauth_store

TOKEN_URL = "https://auth.atlassian.com/oauth/token"


def _refresh_jira(workspace: dict[str, Any]) -> dict[str, Any]:
    refresh = workspace.get("jira_refresh_token")
    client_id = os.environ.get("JIRA_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("JIRA_OAUTH_CLIENT_SECRET")
    if not refresh or not client_id or not client_secret:
        return workspace
    expires_at = int(workspace.get("jira_expires_at") or 0)
    if expires_at and expires_at - 60 > int(time.time()):
        return workspace

    response = requests.post(
        TOKEN_URL,
        json={
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh,
        },
        timeout=20,
    )
    if not response.ok:
        raise RuntimeError(f"Jira token refresh failed ({response.status_code})")
    payload = response.json()
    return oauth_store.put_workspace(
        {
            "jira_access_token": payload.get("access_token"),
            "jira_refresh_token": payload.get("refresh_token") or refresh,
            "jira_expires_at": int(time.time()) + int(payload.get("expires_in") or 3600),
        }
    )


def resolve_auth(event: dict[str, Any] | None = None) -> dict[str, str]:
    try:
        workspace = oauth_store.get_workspace()
    except Exception:
        workspace = None

    if workspace and workspace.get("jira_access_token"):
        workspace = _refresh_jira(workspace)
        cloud_id = workspace.get("jira_cloud_id")
        if not cloud_id:
            raise RuntimeError("Jira is connected but cloudId is missing. Reconnect Jira.")
        return {
            "mode": "oauth",
            "access_token": workspace["jira_access_token"],
            "cloud_id": cloud_id,
            "site_url": (workspace.get("jira_site_url") or "").rstrip("/"),
            "base_url": f"https://api.atlassian.com/ex/jira/{cloud_id}",
        }

    creds = credentials_from_event(event)
    if creds.get("email") and creds.get("token") and creds.get("base_url"):
        return {
            "mode": "basic",
            "email": creds["email"],
            "token": creds["token"],
            "base_url": creds["base_url"].rstrip("/"),
            "site_url": creds["base_url"].rstrip("/"),
        }

    raise RuntimeError("Connect Jira from Connect your org before using this API")


def resolve_base_url(auth: dict[str, str] | None = None) -> str:
    if auth:
        return (auth.get("site_url") or auth.get("base_url") or "").rstrip("/")
    return ""


def _headers(auth: dict[str, str]) -> dict[str, str]:
    if auth.get("mode") == "oauth":
        return {
            "Authorization": f"Bearer {auth['access_token']}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
    basic = base64.b64encode(f"{auth['email']}:{auth['token']}".encode()).decode()
    return {
        "Authorization": f"Basic {basic}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def jira_get(
    path: str,
    params: dict[str, Any] | None = None,
    auth: dict[str, str] | None = None,
    event: dict[str, Any] | None = None,
    **_legacy: Any,
) -> dict[str, Any]:
    resolved = auth or resolve_auth(event)
    url = f"{resolved['base_url']}{path}"
    response = requests.get(
        url,
        headers=_headers(resolved),
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
    auth: dict[str, str] | None = None,
    event: dict[str, Any] | None = None,
    **_legacy: Any,
) -> dict[str, Any]:
    resolved = auth or resolve_auth(event)
    url = f"{resolved['base_url']}{path}"
    response = requests.post(
        url,
        headers=_headers(resolved),
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
    auth: dict[str, str] | None = None,
    event: dict[str, Any] | None = None,
    **_legacy: Any,
) -> dict[str, Any]:
    resolved = auth or resolve_auth(event)
    body = {"jql": jql, "maxResults": max_results, "fields": fields}
    try:
        return jira_post("/rest/api/3/search/jql", body, auth=resolved)
    except RuntimeError as exc:
        message = str(exc)
        if "404" in message or "410" in message or "not found" in message.lower():
            return jira_post("/rest/api/3/search", body, auth=resolved)
        raise
