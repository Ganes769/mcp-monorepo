import os
import time
from urllib.parse import urlencode

import requests

from src.clients import oauth_store

TOKEN_URL = "https://auth.atlassian.com/oauth/token"
RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources"


def _api_base(event) -> str:
    configured = os.environ.get("OAUTH_REDIRECT_BASE")
    if configured:
        return configured.rstrip("/")
    headers = event.get("headers") or {}
    host = headers.get("host") or headers.get("Host")
    return f"https://{host}"


def _app_url() -> str:
    return os.environ.get("WEB_APP_URL", "http://localhost:5173").rstrip("/")


def handler(event, context):
    query = event.get("queryStringParameters") or {}
    code = query.get("code")
    state = query.get("state")
    app = _app_url()

    if not code or not state or not oauth_store.consume_oauth_state(state):
        return {
            "statusCode": 302,
            "headers": {"Location": f"{app}/?jira=error"},
            "body": "",
        }

    client_id = os.environ.get("JIRA_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("JIRA_OAUTH_CLIENT_SECRET")
    redirect_uri = f"{_api_base(event)}/oauth/jira/callback"
    token_response = requests.post(
        TOKEN_URL,
        json={
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        },
        timeout=20,
    )
    if not token_response.ok:
        return {
            "statusCode": 302,
            "headers": {"Location": f"{app}/?jira=error"},
            "body": "",
        }

    tokens = token_response.json()
    access = tokens.get("access_token")
    resources = requests.get(
        RESOURCES_URL,
        headers={"Authorization": f"Bearer {access}", "Accept": "application/json"},
        timeout=20,
    ).json()
    site = (resources or [{}])[0]

    oauth_store.put_workspace(
        {
            "jira_access_token": access,
            "jira_refresh_token": tokens.get("refresh_token"),
            "jira_expires_at": int(time.time()) + int(tokens.get("expires_in") or 3600),
            "jira_cloud_id": site.get("id"),
            "jira_site_url": site.get("url"),
            "jira_site_name": site.get("name"),
        }
    )

    return {
        "statusCode": 302,
        "headers": {"Location": f"{app}/?jira=connected"},
        "body": "",
    }
