import json
import os

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from src.api.standup import FIELDS, _stale_days, build_standup_payload
from src.clients import oauth_store
from src.clients.jira import get_myself, resolve_auth, resolve_base_url, search_issues


def _parse_body(event) -> dict:
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        import base64

        raw = base64.b64decode(raw).decode()
    if isinstance(raw, dict):
        return raw
    return json.loads(raw)


def handler(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        query = event.get("queryStringParameters") or {}
        body = _parse_body(event)

        project_key = (
            path_params.get("projectKey")
            or os.environ.get("STANDUP_PROJECT_KEY")
            or ""
        ).upper()
        if not project_key:
            raise RuntimeError("Select a Jira project first")
        jql = (
            body.get("jql")
            or (query or {}).get("jql")
            or f"project = {project_key} ORDER BY updated DESC"
        )
        max_results = int(
            body.get("maxResults") or (query or {}).get("maxResults") or 50
        )
        workspace = {}
        try:
            workspace = oauth_store.get_workspace() or {}
        except Exception:
            workspace = {}
        channel = (
            body.get("channel")
            or (query or {}).get("channel")
            or workspace.get("slack_channel_id")
            or os.environ.get("SLACK_CHANNEL_ID")
        )
        token = workspace.get("slack_bot_token") or os.environ.get("SLACK_BOT_TOKEN")
        auth = resolve_auth(event)
        site = resolve_base_url(auth)

        if not token:
            raise RuntimeError("Connect Slack first")
        if not channel:
            raise RuntimeError(
                "channel is required (body/query) or set SLACK_CHANNEL_ID"
            )

        myself = None
        try:
            myself = get_myself(auth=auth)
        except Exception:
            myself = None

        data = search_issues(
            jql=jql,
            fields=FIELDS,
            max_results=max_results,
            auth=auth,
        )
        payload = build_standup_payload(
            issues=data.get("issues") or [],
            site=site,
            project_key=project_key,
            jql=jql,
            myself=myself,
            stale_days=_stale_days(query or body),
        )
        client = WebClient(token=token)
        result = client.chat_postMessage(channel=channel, text=payload["text"])

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "data": {
                        **payload,
                        "channel": channel,
                        "ts": result.get("ts"),
                    }
                },
                default=str,
            ),
        }
    except SlackApiError as exc:
        return {
            "statusCode": 502,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {"error": f"Slack API error: {exc.response.get('error', str(exc))}"}
            ),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
