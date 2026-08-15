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
        provider = (_parse_body(event).get("provider") or "jira").lower()
        if provider == "slack":
            oauth_store.clear_slack()
        else:
            oauth_store.clear_jira()
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"data": {"disconnected": provider}}),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
