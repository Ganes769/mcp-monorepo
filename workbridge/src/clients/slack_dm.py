import re
from collections import defaultdict

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


def _users_by_email_and_name(client: WebClient) -> tuple[dict[str, str], dict[str, str]]:
    by_email: dict[str, str] = {}
    by_name: dict[str, list[str]] = defaultdict(list)
    cursor = None
    while True:
        result = client.users_list(limit=200, cursor=cursor)
        for user in result.get("members") or []:
            if user.get("deleted") or user.get("is_bot") or user.get("id") == "USLACKBOT":
                continue
            user_id = user.get("id")
            profile = user.get("profile") or {}
            email = (profile.get("email") or user.get("profile", {}).get("email") or "").lower()
            names = {
                (profile.get("real_name") or user.get("real_name") or "").strip().lower(),
                (profile.get("display_name") or "").strip().lower(),
            }
            if email and user_id:
                by_email[email] = user_id
            for name in names:
                if name and user_id:
                    by_name[name].append(user_id)
        cursor = (result.get("response_metadata") or {}).get("next_cursor") or None
        if not cursor:
            break
    unique_name = {name: ids[0] for name, ids in by_name.items() if len(ids) == 1}
    return by_email, unique_name


def slack_user_id(
    client: WebClient,
    *,
    email: str | None,
    display_name: str | None,
    cache: dict,
) -> str | None:
    if "by_email" not in cache:
        cache["by_email"], cache["by_name"] = _users_by_email_and_name(client)

    if email:
        user_id = cache["by_email"].get(email.lower())
        if user_id:
            return user_id
        try:
            lookup = client.users_lookupByEmail(email=email)
            return (lookup.get("user") or {}).get("id")
        except SlackApiError:
            pass

    if display_name:
        return cache["by_name"].get(display_name.strip().lower())
    return None


def people_for_mentions(payload: dict, myself: dict | None = None) -> list[dict]:
    people = [dict(person) for person in (payload.get("assignees") or [])]
    me = payload.get("me") or {}
    email = (myself or {}).get("emailAddress")
    if me.get("accountId") or me.get("displayName"):
        people.append(
            {
                "accountId": me.get("accountId"),
                "displayName": me.get("displayName") or (myself or {}).get("displayName"),
                "email": email,
            }
        )
    if email:
        for person in people:
            if person.get("accountId") == me.get("accountId") and not person.get("email"):
                person["email"] = email
    return people


def slack_text_with_mentions(
    client: WebClient,
    text: str,
    payload: dict,
    *,
    myself: dict | None = None,
    cache: dict | None = None,
    ping: bool = False,
) -> str:
    cache = cache if cache is not None else {}
    people = people_for_mentions(payload, myself)
    mapping = mention_map(client, people, cache)
    mentioned = apply_mentions(text or "", mapping)
    if not ping:
        return mentioned
    active = [
        person
        for person in people
        if person.get("blocked") or person.get("in_progress") or person.get("accountId") == (payload.get("me") or {}).get("accountId")
    ]
    pings = mention_line(client, active or people, cache)
    if not pings:
        return mentioned
    return f"{pings}\n\n{mentioned}"


def mention_tag(user_id: str | None, name: str | None = None) -> str:
    if user_id:
        return f"<@{user_id}>"
    return name or "Unassigned"


def mention_map(client: WebClient, people: list[dict], cache: dict) -> dict[str, str]:
    """Lowercase display name / first name -> <@USERID>."""
    mapping: dict[str, str] = {}
    first_names: dict[str, list[str]] = defaultdict(list)
    for person in people or []:
        user_id = slack_user_id(
            client,
            email=person.get("email"),
            display_name=person.get("displayName"),
            cache=cache,
        )
        if not user_id:
            continue
        tag = mention_tag(user_id)
        name = (person.get("displayName") or "").strip()
        if name:
            mapping[name.lower()] = tag
            first = name.split()[0].lower()
            first_names[first].append(tag)
    for first, tags in first_names.items():
        unique = list(dict.fromkeys(tags))
        if len(unique) == 1 and first not in mapping:
            mapping[first] = unique[0]
    return mapping


def apply_mentions(text: str, mapping: dict[str, str]) -> str:
    if not text or not mapping:
        return text
    result = text
    for name, tag in sorted(mapping.items(), key=lambda item: len(item[0]), reverse=True):
        if len(name) < 2:
            continue
        result = re.sub(
            rf"(?<![A-Za-z]){re.escape(name)}(?![A-Za-z])",
            tag,
            result,
            flags=re.IGNORECASE,
        )
    return result


def mention_line(client: WebClient, people: list[dict], cache: dict) -> str:
    tags = []
    seen = set()
    for person in people or []:
        user_id = slack_user_id(
            client,
            email=person.get("email"),
            display_name=person.get("displayName"),
            cache=cache,
        )
        if not user_id or user_id in seen:
            continue
        seen.add(user_id)
        tags.append(mention_tag(user_id))
    return " ".join(tags)


def open_dm(client: WebClient, user_id: str) -> str:
    opened = client.conversations_open(users=user_id)
    return (opened.get("channel") or {}).get("id") or user_id
