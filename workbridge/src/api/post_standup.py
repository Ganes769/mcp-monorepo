import json
import os

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from src.api.standup import FIELDS, _bucket, _build_text
from src.clients import oauth_store
from src.clients.jira import resolve_auth, resolve_base_url, search_issues


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
            or f"project = {project_key} ORDER BY created DESC"
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

        data = search_issues(
            jql=jql,
            fields=FIELDS,
            max_results=max_results,
            auth=auth,
        )

        groups = {"todo": [], "in_progress": [], "done": [], "blocked": []}
        for issue in data.get("issues") or []:
            fields = issue.get("fields") or {}
            status = (fields.get("status") or {}).get("name")
            item = {
                "key": issue.get("key"),
                "summary": fields.get("summary"),
                "status": status,
                "assignee": (fields.get("assignee") or {}).get("displayName"),
                "url": f"{site}/browse/{issue.get('key')}",
            }
            groups[_bucket(status, fields.get("labels") or [])].append(item)

        text = _build_text(project_key, groups)
        client = WebClient(token=token)
        result = client.chat_postMessage(channel=channel, text=text)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "data": {
                        "projectKey": project_key,
                        "channel": channel,
                        "ts": result.get("ts"),
                        "counts": {key: len(value) for key, value in groups.items()},
                        "text": text,
                    }
                }
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
