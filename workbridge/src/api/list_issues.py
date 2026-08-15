import json

from src.clients.jira import resolve_auth, resolve_base_url, search_issues

FIELDS = [
    "summary",
    "status",
    "assignee",
    "priority",
    "issuetype",
    "updated",
    "created",
]


def handler(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        query = event.get("queryStringParameters") or {}
        project_key = (path_params.get("projectKey") or "").upper()
        if not project_key:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Select a Jira project first"}),
            }

        jql = query.get("jql") or f"project = {project_key} ORDER BY created DESC"
        max_results = int(query.get("maxResults") or 50)
        auth = resolve_auth(event)
        site = resolve_base_url(auth)

        data = search_issues(
            jql=jql,
            fields=FIELDS,
            max_results=max_results,
            auth=auth,
        )

        issues = []
        for issue in data.get("issues") or []:
            fields = issue.get("fields") or {}
            assignee = fields.get("assignee") or {}
            status = fields.get("status") or {}
            priority = fields.get("priority") or {}
            issuetype = fields.get("issuetype") or {}
            key = issue.get("key")
            issues.append(
                {
                    "key": key,
                    "id": issue.get("id"),
                    "summary": fields.get("summary"),
                    "status": status.get("name"),
                    "assignee": assignee.get("displayName"),
                    "priority": priority.get("name"),
                    "issuetype": issuetype.get("name"),
                    "updated": fields.get("updated"),
                    "created": fields.get("created"),
                    "url": f"{site}/browse/{key}",
                }
            )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "data": {
                        "projectKey": project_key,
                        "jql": jql,
                        "total": data.get("total", len(issues)),
                        "issues": issues,
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
