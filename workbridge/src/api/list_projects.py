import json

from src.clients.jira import jira_get, resolve_auth


def handler(event, context):
    try:
        auth = resolve_auth(event)
        data = jira_get(
            "/rest/api/3/project/search",
            params={"maxResults": 50},
            auth=auth,
        )
        projects = [
            {
                "id": project.get("id"),
                "key": project.get("key"),
                "name": project.get("name"),
                "style": project.get("style"),
            }
            for project in (data.get("values") or [])
        ]
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"data": projects}),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
