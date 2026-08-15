"""DynamoDB store for Jira/Slack OAuth tokens and CSRF state."""

from __future__ import annotations

import os
import time
from typing import Any

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

TABLE = os.environ.get("CONNECTIONS_TABLE", "")
WORKSPACE_PK = "workspace#default"
serializer = TypeSerializer()
deserializer = TypeDeserializer()


def _table():
    if not TABLE:
        raise RuntimeError("CONNECTIONS_TABLE is not set")
    return boto3.client("dynamodb")


def _from_item(item: dict[str, Any]) -> dict[str, Any]:
    return {key: deserializer.deserialize(value) for key, value in item.items()}


def get_workspace() -> dict[str, Any] | None:
    response = _table().get_item(TableName=TABLE, Key={"pk": serializer.serialize(WORKSPACE_PK)})
    item = response.get("Item")
    return _from_item(item) if item else None


def put_workspace(fields: dict[str, Any]) -> dict[str, Any]:
    current = get_workspace() or {"pk": WORKSPACE_PK}
    current.update(fields)
    current["updated_at"] = int(time.time())
    item = {key: serializer.serialize(value) for key, value in current.items() if value is not None}
    _table().put_item(TableName=TABLE, Item=item)
    return current


def replace_workspace(item: dict[str, Any]) -> dict[str, Any]:
    cleaned = {key: value for key, value in item.items() if value is not None}
    cleaned["pk"] = WORKSPACE_PK
    cleaned["updated_at"] = int(time.time())
    serialized = {key: serializer.serialize(value) for key, value in cleaned.items()}
    _table().put_item(TableName=TABLE, Item=serialized)
    return cleaned


def clear_jira() -> None:
    current = get_workspace() or {"pk": WORKSPACE_PK}
    for key in (
        "jira_access_token",
        "jira_refresh_token",
        "jira_cloud_id",
        "jira_site_url",
        "jira_site_name",
        "jira_expires_at",
    ):
        current.pop(key, None)
    replace_workspace(current)


def clear_slack() -> None:
    current = get_workspace() or {"pk": WORKSPACE_PK}
    for key in (
        "slack_bot_token",
        "slack_team_id",
        "slack_team_name",
        "slack_channel_id",
    ):
        current.pop(key, None)
    replace_workspace(current)


def put_oauth_state(state: str) -> None:
    _table().put_item(
        TableName=TABLE,
        Item={
            "pk": serializer.serialize(f"oauth#state#{state}"),
            "created_at": serializer.serialize(int(time.time())),
        },
    )


def consume_oauth_state(state: str) -> bool:
    key = {"pk": serializer.serialize(f"oauth#state#{state}")}
    response = _table().get_item(TableName=TABLE, Key=key)
    if not response.get("Item"):
        return False
    _table().delete_item(TableName=TABLE, Key=key)
    return True
