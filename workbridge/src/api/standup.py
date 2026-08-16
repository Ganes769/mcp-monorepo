import json
import os
import re
from datetime import datetime, timedelta, timezone

from src.clients.brief_ai import summarize as summarize_brief
from src.clients.jira import get_myself, resolve_auth, resolve_base_url, search_issues

FIELDS = [
    "summary",
    "status",
    "assignee",
    "priority",
    "issuetype",
    "labels",
    "updated",
    "created",
    "resolutiondate",
    "statuscategorychangedate",
]
TEAM_IN_PROGRESS_LIMIT = 5
DEFAULT_STALE_DAYS = 3


def _parse_jira_date(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    if normalized.endswith("+0000"):
        normalized = normalized[:-5] + "+00:00"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _bucket(status_name: str, labels: list) -> str:
    status = (status_name or "").lower()
    label_set = {str(label).lower() for label in (labels or [])}
    if "blocked" in status or "blocked" in label_set:
        return "blocked"
    if status in {"in progress", "in review", "doing"}:
        return "in_progress"
    if status in {"done", "closed", "resolved", "complete"}:
        return "done"
    return "todo"


def _issue_item(issue: dict, site: str) -> dict:
    fields = issue.get("fields") or {}
    assignee = fields.get("assignee") or {}
    status = (fields.get("status") or {}).get("name")
    return {
        "key": issue.get("key"),
        "summary": fields.get("summary"),
        "status": status,
        "assignee": assignee.get("displayName"),
        "assigneeAccountId": assignee.get("accountId"),
        "assigneeEmail": assignee.get("emailAddress"),
        "updated": fields.get("updated"),
        "url": f"{site}/browse/{issue.get('key')}",
        "bucket": _bucket(status, fields.get("labels") or []),
        "resolved_at": _parse_jira_date(
            fields.get("resolutiondate")
            or fields.get("statuscategorychangedate")
            or fields.get("updated")
        ),
        "updated_at": _parse_jira_date(fields.get("updated")),
    }


def _public_issue(item: dict) -> dict:
    return {
        "key": item.get("key"),
        "summary": item.get("summary"),
        "status": item.get("status"),
        "assignee": item.get("assignee"),
        "updated": item.get("updated"),
        "url": item.get("url"),
    }


def _ticket_label(item: dict | None) -> str:
    if not item:
        return ""
    key = (item.get("key") or "").strip()
    summary = " ".join(str(item.get("summary") or "").split())
    if key and summary:
        return f"[{key}] {summary}"
    return key or summary


def _ticket_labels(items: list[dict] | None) -> dict[str, str]:
    labels: dict[str, str] = {}
    for item in items or []:
        key = (item.get("key") or "").strip()
        if not key:
            continue
        labels[key] = _ticket_label(item)
    return labels


def _expand_ticket_titles(text: str, labels: dict[str, str]) -> str:
    if not text or not labels:
        return text
    keys = sorted(labels, key=len, reverse=True)
    pattern = re.compile(r"\[?(" + "|".join(re.escape(key) for key in keys) + r")\]?")

    def replace(match: re.Match) -> str:
        key = match.group(1)
        return labels.get(key) or match.group(0)

    return pattern.sub(replace, text)


def _assignee_briefs(blocked, in_progress, done_yesterday) -> list[dict]:
    people: dict[str, dict] = {}
    groups = (
        ("blocked", blocked),
        ("in_progress", in_progress),
        ("done_yesterday", done_yesterday),
    )
    for group_name, group in groups:
        for item in group:
            account_id = item.get("assigneeAccountId")
            if not account_id:
                continue
            person = people.setdefault(
                account_id,
                {
                    "accountId": account_id,
                    "displayName": item.get("assignee"),
                    "email": item.get("assigneeEmail"),
                    "blocked": [],
                    "in_progress": [],
                    "done_yesterday": [],
                },
            )
            if item.get("assigneeEmail") and not person.get("email"):
                person["email"] = item.get("assigneeEmail")
            person[group_name].append(_public_issue(item))
    result = []
    for person in people.values():
        person["questions"] = _person_questions(person)
        result.append(person)
    return result


def _person_questions(person: dict) -> list[str]:
    questions = []
    for item in person.get("done_yesterday") or []:
        questions.append(f"What did you finish on {_ticket_label(item)} yesterday?")
    for item in person.get("in_progress") or []:
        questions.append(f"What will you complete on {_ticket_label(item)} today?")
    for item in person.get("blocked") or []:
        questions.append(f"What is blocking {_ticket_label(item)}, and who can unblock it?")
    questions.append("Any new blockers for DSU?")
    return questions[:5]


def _format_line(item: dict) -> str:
    assignee = item.get("assignee") or "Unassigned"
    status = item.get("status") or "Unknown"
    return f"• [{item['key']}] {item['summary']} — {assignee} ({status})"


def _section_lines(title: str, items: list[dict], empty: str = "• No items") -> list[str]:
    lines = [f"{title} ({len(items)})"]
    if items:
        lines.extend(_format_line(item) for item in items)
    else:
        lines.append(empty)
    lines.append("")
    return lines


def _build_team_text(project_key: str, team: dict, stale_days: int) -> str:
    today = datetime.now(timezone.utc).strftime("%d %b %Y")
    counts = team["counts"]
    lines = [
        f"Daily Standup — Project {project_key}",
        f"Date: {today} (UTC)",
        f"At risk: {counts['blocked']} blocked · {counts['stale']} stale · {counts['unassigned']} unassigned",
        f"Board: {counts['in_progress']} in progress · {counts['done_yesterday']} done since yesterday · {counts['todo']} to do",
        "",
    ]
    lines.extend(_section_lines("Blocked", team["blocked"]))
    lines.extend(
        _section_lines(
            f"In progress (showing {len(team['in_progress'])} of {counts['in_progress']})",
            team["in_progress"],
        )
    )
    lines.extend(_section_lines("Done since yesterday", team["done_yesterday"]))
    lines.append(
        f"Rest of board: {counts['todo']} to do · {counts['done']} done · stale window {stale_days}d"
    )
    lines.append("")
    lines.append("Generated by WorkBridge")
    return "\n".join(lines).rstrip() + "\n"


def build_standup_payload(
    issues: list[dict],
    site: str,
    project_key: str,
    jql: str,
    myself: dict | None = None,
    stale_days: int = DEFAULT_STALE_DAYS,
) -> dict:
    now = datetime.now(timezone.utc)
    start_yesterday = (now - timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    stale_before = now - timedelta(days=stale_days)
    me_id = (myself or {}).get("accountId")

    items = [_issue_item(issue, site) for issue in issues]
    blocked = [item for item in items if item["bucket"] == "blocked"]
    in_progress = [item for item in items if item["bucket"] == "in_progress"]
    done = [item for item in items if item["bucket"] == "done"]
    todo = [item for item in items if item["bucket"] == "todo"]
    done_yesterday = [
        item
        for item in done
        if item.get("resolved_at") and item["resolved_at"] >= start_yesterday
    ]
    stale = [
        item
        for item in in_progress
        if item.get("updated_at") and item["updated_at"] < stale_before
    ]
    unassigned = [item for item in in_progress if not item.get("assigneeAccountId")]

    def mine(group: list[dict]) -> list[dict]:
        if not me_id:
            return []
        return [item for item in group if item.get("assigneeAccountId") == me_id]

    me_in_progress = mine(in_progress)
    me_blocked = mine(blocked)
    me_done = mine(done_yesterday)
    me_empty = not (me_in_progress or me_blocked or me_done)

    team = {
        "blocked": [_public_issue(item) for item in blocked],
        "in_progress": [_public_issue(item) for item in in_progress[:TEAM_IN_PROGRESS_LIMIT]],
        "done_yesterday": [_public_issue(item) for item in done_yesterday],
        "counts": {
            "blocked": len(blocked),
            "in_progress": len(in_progress),
            "done_yesterday": len(done_yesterday),
            "todo": len(todo),
            "done": len(done),
            "stale": len(stale),
            "unassigned": len(unassigned),
            "total": len(items),
        },
    }
    payload = {
        "projectKey": project_key,
        "jql": jql,
        "staleDays": stale_days,
        "team": team,
        "me": {
            "accountId": me_id,
            "displayName": (myself or {}).get("displayName"),
            "empty": me_empty,
            "emptyMessage": "Nothing assigned to you",
            "in_progress": [_public_issue(item) for item in me_in_progress],
            "blocked": [_public_issue(item) for item in me_blocked],
            "done_yesterday": [_public_issue(item) for item in me_done],
        },
        "atRisk": {
            "blocked": [_public_issue(item) for item in blocked],
            "stale": [_public_issue(item) for item in stale],
            "unassigned": [_public_issue(item) for item in unassigned],
        },
        "assignees": _assignee_briefs(blocked, in_progress, done_yesterday),
        "text": _build_team_text(project_key, team, stale_days),
        "ai": {"status": "skipped", "reason": "not generated"},
    }
    ai = summarize_brief(payload)
    labels = _ticket_labels(
        team["blocked"] + team["in_progress"] + team["done_yesterday"]
        + payload["atRisk"]["stale"] + payload["atRisk"]["unassigned"]
    )
    if ai.get("status") == "ok":
        ai["summary"] = _expand_ticket_titles(ai.get("summary") or "", labels)
        ai["asks"] = [_expand_ticket_titles(ask, labels) for ask in (ai.get("asks") or [])]
        ai["questions"] = [
            _expand_ticket_titles(question, labels) for question in (ai.get("questions") or [])
        ]
    payload["ai"] = ai
    if ai.get("status") == "ok" and ai.get("summary"):
        asks = ai.get("asks") or []
        questions = ai.get("questions") or []
        lead = [ai["summary"], ""]
        if questions:
            lead.append("Questions to answer in DSU")
            lead.extend(f"• {item}" for item in questions)
            lead.append("")
        if asks:
            lead.append("Suggested asks")
            lead.extend(f"• {ask}" for ask in asks)
            lead.append("")
        payload["text"] = "\n".join(lead) + payload["text"]
    return payload


def _stale_days(query: dict | None) -> int:
    raw = (query or {}).get("staleDays") or os.environ.get("STANDUP_STALE_DAYS")
    try:
        value = int(raw) if raw else DEFAULT_STALE_DAYS
    except (TypeError, ValueError):
        value = DEFAULT_STALE_DAYS
    return max(1, value)


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
        jql = query.get("jql") or f"project = {project_key} ORDER BY updated DESC"
        max_results = int(query.get("maxResults") or 50)
        auth = resolve_auth(event)
        site = resolve_base_url(auth)
        myself = None
        try:
            myself = get_myself(auth=auth)
        except Exception:
            myself = None

        data = search_issues(
            jql=jql,
            fields=FIELDS,
            max_results=max_results,
            auth=auth,
        )
        payload = build_standup_payload(
            issues=data.get("issues") or [],
            site=site,
            project_key=project_key,
            jql=jql,
            myself=myself,
            stale_days=_stale_days(query),
        )
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"data": payload}, default=str),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
