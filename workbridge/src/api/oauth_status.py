import json

from src.clients import oauth_store
from src.clients.oauth_redirect import slack_redirect_uri


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
                    },
                    "slack": {
                        "connected": bool(workspace.get("slack_bot_token")),
                        "teamName": workspace.get("slack_team_name"),
                        "channelId": workspace.get("slack_channel_id"),
                        "redirectUri": slack_redirect_uri(),
                    },
                    "projectKey": workspace.get("standup_project_key") or "",
                }
            }
        ),
    }
