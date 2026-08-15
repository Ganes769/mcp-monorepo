import os
import secrets
from urllib.parse import urlencode, urlsplit

from src.clients import oauth_store


def _normalize_redirect_base(configured: str, callback_path: str = "") -> str:
    value = (configured or "").strip()
    if not value:
        return ""

    parsed = urlsplit(value)
    if parsed.scheme and parsed.netloc:
        base = f"{parsed.scheme}://{parsed.netloc}"
        callback = (callback_path or "").rstrip("/")
        if callback and parsed.path.rstrip("/") == callback:
            return base
        return base

    if callback_path:
        callback = callback_path.rstrip("/")
        if value.rstrip("/").endswith(callback):
            return value[: -len(callback)].rstrip("/")
    return value.rstrip("/")


def _base(event, callback_path: str = "") -> str:
    configured = os.environ.get("OAUTH_REDIRECT_BASE")
    if configured:
        return _normalize_redirect_base(configured, callback_path)
    headers = event.get("headers") or {}
    host = headers.get("host") or headers.get("Host")
    return f"https://{host}"


def handler(event, context):
    client_id = os.environ.get("JIRA_OAUTH_CLIENT_ID")
    if not client_id:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": '{"error":"JIRA_OAUTH_CLIENT_ID is not configured"}',
        }

    state = secrets.token_urlsafe(24)
    oauth_store.put_oauth_state(state)
    redirect_uri = f"{_base(event, '/oauth/jira/callback')}/oauth/jira/callback"
    query = urlencode(
        {
            "audience": "api.atlassian.com",
            "client_id": client_id,
            "scope": "read:jira-work read:jira-user offline_access",
            "redirect_uri": redirect_uri,
            "state": state,
            "response_type": "code",
            "prompt": "consent",
        }
    )
    return {
        "statusCode": 302,
        "headers": {"Location": f"https://auth.atlassian.com/authorize?{query}"},
        "body": "",
    }
