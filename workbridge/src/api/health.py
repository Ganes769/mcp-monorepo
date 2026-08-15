import json
import os


def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "status": "ok",
                "stage": os.environ.get("STAGE", "unknown"),
                "jira_oauth_configured": bool(os.environ.get("JIRA_OAUTH_CLIENT_ID")),
            }
        ),
    }
