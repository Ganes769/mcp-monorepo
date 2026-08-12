import json

from src.api._jira_auth import credentials_from_event
from src.clients.jira import jira_get, resolve_base_url


def handler(event, context):
    try:
        issue_key = (event.get("pathParameters") or {}).get("issueKey")
        if not issue_key:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "issueKey is required"}),
            }

        creds = credentials_from_event(event)
        site = resolve_base_url(creds["base_url"])
        issue = jira_get(
            f"/rest/api/3/issue/{issue_key}",
            params={
                "fields": "summary,status,assignee,priority,issuetype,updated,created,description",
            },
            email=creds["email"],
            token=creds["token"],
            base_url=creds["base_url"],
        )
        fields = issue.get("fields") or {}
        key = issue.get("key")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "data": {
                        "key": key,
                        "summary": fields.get("summary"),
                        "status": (fields.get("status") or {}).get("name"),
                        "assignee": (fields.get("assignee") or {}).get("displayName"),
                        "priority": (fields.get("priority") or {}).get("name"),
                        "issuetype": (fields.get("issuetype") or {}).get("name"),
                        "updated": fields.get("updated"),
                        "created": fields.get("created"),
                        "url": f"{site}/browse/{key}",
                        "description": fields.get("description"),
                    }
                }
            ),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
