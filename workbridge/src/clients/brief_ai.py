import json
import os
from typing import Any

import requests

SYSTEM_PROMPT = """You write a morning standup brief from Jira groupings.
Rules:
- Use only the tickets provided. Do not invent keys, people, or work.
- Name a person only if that ticket has an assignee.
- Write 5-8 short lines in summary. Plain text, no markdown headings.
- If nothing is blocked, stale, or unassigned, say the morning looks clear.
- asks: at most 3 suggested questions for the facilitator to ask others.
  Format: "Name: question about [KEY] ticket title"
  Example: "Ganesh Gnawali: What is the status of [KAN-2] Authentication?"
- questions: 3-5 questions EACH PERSON should be ready to answer in DSU.
  Cover yesterday, today, and blockers. Always include [KEY] and the ticket title.
  Example: "What did you finish on [KAN-3] Create login page yesterday?"
  Never mention a key without its title.
- Return JSON only: {"summary": "multiline string", "asks": ["..."], "questions": ["..."]}
"""


def _compact_issues(items: list[dict] | None) -> list[dict]:
    compact = []
    for item in items or []:
        compact.append(
            {
                "key": item.get("key"),
                "summary": item.get("summary"),
                "status": item.get("status"),
                "assignee": item.get("assignee"),
            }
        )
    return compact


def _context(payload: dict[str, Any]) -> dict[str, Any]:
    team = payload.get("team") or {}
    at_risk = payload.get("atRisk") or {}
    return {
        "projectKey": payload.get("projectKey"),
        "staleDays": payload.get("staleDays"),
        "counts": team.get("counts"),
        "blocked": _compact_issues(team.get("blocked")),
        "in_progress": _compact_issues(team.get("in_progress")),
        "done_yesterday": _compact_issues(team.get("done_yesterday")),
        "stale": _compact_issues(at_risk.get("stale")),
        "unassigned": _compact_issues(at_risk.get("unassigned")),
    }


def _parse_content(content: str) -> dict[str, Any] | None:
    raw = (content or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    summary = str(data.get("summary") or "").strip()
    if not summary:
        return None
    asks = [str(item).strip() for item in (data.get("asks") or []) if str(item).strip()]
    questions = [
        str(item).strip() for item in (data.get("questions") or []) if str(item).strip()
    ]
    if not questions:
        questions = [
            "What did you finish yesterday?",
            "What will you work on today?",
            "What is blocked, and who can help?",
        ]
    return {"summary": summary, "asks": asks[:3], "questions": questions[:5]}


def _error_message(response: requests.Response) -> str:
    try:
        payload = response.json().get("error") or {}
        if isinstance(payload, dict):
            return str(payload.get("message") or payload.get("status") or "")
        return str(payload)
    except Exception:
        return (response.text or "")[:200]


def _openai_compatible(
    *,
    name: str,
    api_key: str,
    base_url: str,
    model: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    try:
        response = requests.post(
            f"{base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": json.dumps(_context(payload), default=str),
                    },
                ],
            },
            timeout=12,
        )
        if not response.ok:
            detail = _error_message(response)
            return {
                "status": "failed",
                "reason": f"{name} {response.status_code}{': ' + detail if detail else ''}",
            }
        content = (
            ((response.json().get("choices") or [{}])[0].get("message") or {}).get(
                "content"
            )
            or ""
        )
        parsed = _parse_content(content)
        if not parsed:
            return {"status": "failed", "reason": f"{name} returned an unreadable brief"}
        return {"status": "ok", **parsed}
    except Exception as exc:
        return {"status": "failed", "reason": str(exc)[:200]}


def _gemini(api_key: str, model: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": api_key},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [
                    {
                        "parts": [
                            {"text": json.dumps(_context(payload), default=str)}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json",
                },
            },
            timeout=12,
        )
        if not response.ok:
            detail = _error_message(response)
            return {
                "status": "failed",
                "reason": f"Gemini {response.status_code}{': ' + detail if detail else ''}",
            }
        parts = (
            ((response.json().get("candidates") or [{}])[0].get("content") or {}).get(
                "parts"
            )
            or []
        )
        content = "".join(str(part.get("text") or "") for part in parts)
        parsed = _parse_content(content)
        if not parsed:
            return {"status": "failed", "reason": "Gemini returned an unreadable brief"}
        return {"status": "ok", **parsed}
    except Exception as exc:
        return {"status": "failed", "reason": str(exc)[:200]}


def summarize(payload: dict[str, Any]) -> dict[str, Any]:
    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if groq_key:
        return _openai_compatible(
            name="Groq",
            api_key=groq_key,
            base_url=os.environ.get("GROQ_BASE_URL") or "https://api.groq.com/openai/v1",
            model=os.environ.get("GROQ_MODEL") or "llama-3.1-8b-instant",
            payload=payload,
        )

    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if gemini_key:
        return _gemini(
            gemini_key,
            os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash",
            payload,
        )

    return {
        "status": "skipped",
        "reason": "Set GROQ_API_KEY (free at console.groq.com) then redeploy. OpenAI quota is not used.",
    }
