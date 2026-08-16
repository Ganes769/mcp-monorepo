import json

from src.clients import oauth_store


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
        body = _parse_body(event)
        project_key = (body.get("projectKey") or "").upper()
        if not project_key:
            raise RuntimeError("projectKey is required")
        oauth_store.put_workspace({"standup_project_key": project_key})
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"data": {"projectKey": project_key}}),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
