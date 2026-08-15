import os

from src.api import oauth_slack_start


def test_slack_redirect_uses_base_without_duplicate_callback_path(monkeypatch):
    monkeypatch.setenv("OAUTH_REDIRECT_BASE", " https://example.com/oauth/slack/callback ")
    event = {"headers": {}}

    assert oauth_slack_start._base(event, "/oauth/slack/callback") == "https://example.com"


def test_slack_redirect_keeps_plain_base(monkeypatch):
    monkeypatch.setenv("OAUTH_REDIRECT_BASE", "https://example.com")
    event = {"headers": {}}

    assert oauth_slack_start._base(event, "/oauth/slack/callback") == "https://example.com"
