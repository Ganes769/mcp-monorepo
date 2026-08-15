import json

from src.clients import oauth_store


def handler(event, context):
    try:
        workspace = oauth_store.get_workspace() or {}
    except Exception:
        workspace = {}

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "data": {
                    "jira": {
                        "connected": bool(workspace.get("jira_access_token")),
                        "siteUrl": workspace.get("jira_site_url"),
                        "siteName": workspace.get("jira_site_name"),
                    }
                }
            }
        ),
    }
