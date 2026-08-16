import os
from urllib.parse import urlencode

import requests

from src.clients import oauth_store
from src.clients.oauth_redirect import slack_redirect_uri


def _app_url() -> str:
    return os.environ.get("WEB_APP_URL", "http://localhost:5173").rstrip("/")


def _fail(app: str, reason: str):
    return {
        "statusCode": 302,
        "headers": {"Location": f"{app}/?slack=error&{urlencode({'reason': reason})}"},
        "body": "",
    }


def handler(event, context):
    query = event.get("queryStringParameters") or {}
    code = query.get("code")
    state = query.get("state")
    app = _app_url()

    if query.get("error"):
        return _fail(app, query.get("error_description") or query.get("error"))

    if not os.environ.get("SLACK_OAUTH_CLIENT_SECRET"):
        return _fail(app, "SLACK_OAUTH_CLIENT_SECRET is not configured")

    if not code or not state:
        return _fail(app, "Slack did not return a code")

    if not oauth_store.consume_oauth_state(state):
        return _fail(app, "OAuth state was invalid or expired. Try Connect Slack again.")

    token_response = requests.post(
        "https://slack.com/api/oauth.v2.access",
        data={
            "client_id": os.environ.get("SLACK_OAUTH_CLIENT_ID"),
            "client_secret": os.environ.get("SLACK_OAUTH_CLIENT_SECRET"),
            "code": code,
            "redirect_uri": slack_redirect_uri(),
        },
        timeout=20,
    )
    payload = token_response.json()
    if not payload.get("ok"):
        return _fail(app, payload.get("error") or "Slack token exchange failed")

    team = payload.get("team") or {}
    webhook = payload.get("incoming_webhook") or {}
    authed = payload.get("authed_user") or {}
    oauth_store.put_workspace(
        {
            "slack_bot_token": payload.get("access_token"),
            "slack_team_id": team.get("id"),
            "slack_team_name": team.get("name"),
            "slack_channel_id": webhook.get("channel_id") or None,
            "slack_authed_user_id": authed.get("id") or None,
        }
    )

    return {
        "statusCode": 302,
        "headers": {"Location": f"{app}/?slack=connected"},
        "body": "",
    }
