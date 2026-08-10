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
                "jira_base_url": os.environ.get(
                    "JIRA_BASE_URL",
                    "https://ganeshsnawali.atlassian.net",
                ),
                "jira_configured": bool(
                    os.environ.get("JIRA_EMAIL")
                    and os.environ.get("JIRA_API_TOKEN")
                ),
            }
        ),
    }
