import os


def slack_redirect_uri() -> str:
    explicit = (os.environ.get("SLACK_REDIRECT_URI") or "").strip().rstrip("/")
    if explicit:
        return explicit
    api_base = (os.environ.get("OAUTH_REDIRECT_BASE") or "").strip().rstrip("/")
    if api_base:
        return f"{api_base}/oauth/slack/callback"
    app = (os.environ.get("WEB_APP_URL") or "http://localhost:5173").rstrip("/")
    return f"{app}/oauth/slack/callback"
