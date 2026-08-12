"""Extract optional per-request Jira credentials from API Gateway events."""

from __future__ import annotations

from typing import Any


def credentials_from_event(event: dict[str, Any] | None) -> dict[str, str | None]:
    headers = (event or {}).get("headers") or {}
    normalized = {str(key).lower(): value for key, value in headers.items()}
    return {
        "email": normalized.get("x-jira-email"),
        "token": normalized.get("x-jira-api-token"),
        "base_url": normalized.get("x-jira-base-url"),
    }
