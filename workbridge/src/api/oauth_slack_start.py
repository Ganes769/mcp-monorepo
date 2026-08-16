import os
import secrets
from urllib.parse import urlencode

from src.clients import oauth_store
from src.clients.oauth_redirect import slack_redirect_uri


def handler(event, context):
    client_id = os.environ.get("SLACK_OAUTH_CLIENT_ID")
    if not client_id:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": '{"error":"SLACK_OAUTH_CLIENT_ID is not configured"}',
        }

    state = secrets.token_urlsafe(24)
    oauth_store.put_oauth_state(state)
    redirect_uri = slack_redirect_uri()
    query = urlencode(
        {
            "client_id": client_id,
            "scope": "chat:write,channels:read,im:write,users:read,users:read.email",
            "redirect_uri": redirect_uri,
            "state": state,
        }
    )
    return {
        "statusCode": 302,
        "headers": {"Location": f"https://slack.com/oauth/v2/authorize?{query}"},
        "body": "",
    }
