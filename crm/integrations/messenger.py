"""Facebook Messenger Platform integration (Meta Graph API).

Docs: https://developers.facebook.com/docs/messenger-platform
"""

import hashlib
import hmac
import os

import requests

GRAPH_API_VERSION = "v21.0"


class MessengerError(Exception):
    """Raised when the Graph API rejects a send request."""


class MessengerNotConfigured(Exception):
    """Raised when required Messenger env vars are missing."""


def _page_token():
    token = os.environ.get("MESSENGER_PAGE_TOKEN")
    if not token:
        raise MessengerNotConfigured("Set MESSENGER_PAGE_TOKEN in your .env file first.")
    return token


def is_configured():
    return bool(os.environ.get("MESSENGER_PAGE_TOKEN"))


def send_text(psid, body):
    """Send a freeform text message to a page-scoped user id (PSID)."""
    token = _page_token()
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me/messages"
    resp = requests.post(
        url,
        params={"access_token": token},
        json={
            "messaging_type": "RESPONSE",
            "recipient": {"id": psid},
            "message": {"text": body},
        },
        timeout=15,
    )
    data = resp.json() if resp.content else {}
    if resp.status_code >= 400:
        error = data.get("error", {})
        raise MessengerError(error.get("message", f"Messenger API returned HTTP {resp.status_code}"))
    return data


def fetch_profile_name(psid):
    """Best-effort lookup of a sender's display name. Returns None if unavailable."""
    token = os.environ.get("MESSENGER_PAGE_TOKEN")
    if not token:
        return None
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{psid}"
    try:
        resp = requests.get(
            url, params={"fields": "first_name,last_name", "access_token": token}, timeout=10
        )
        if resp.status_code >= 400:
            return None
        data = resp.json()
    except requests.RequestException:
        return None
    first = data.get("first_name", "")
    last = data.get("last_name", "")
    name = f"{first} {last}".strip()
    return name or None


def verify_signature(raw_body, signature_header):
    """Verify the X-Hub-Signature-256 header Meta sends with every webhook POST."""
    app_secret = os.environ.get("MESSENGER_APP_SECRET") or os.environ.get("META_APP_SECRET")
    if not app_secret:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.removeprefix("sha256="))


def verify_token_matches(token):
    expected = os.environ.get("MESSENGER_VERIFY_TOKEN")
    return bool(expected) and token == expected


def parse_webhook_event(payload):
    """Extract normalized inbound messages from a Messenger webhook payload.

    Returns a list of dicts: {external_id, psid, body}.
    Ignores delivery/read/postback-only events that carry no message text.
    """
    events = []
    for entry in payload.get("entry", []):
        for item in entry.get("messaging", []):
            message = item.get("message")
            if not message or message.get("is_echo"):
                continue  # skip delivery receipts and messages the Page itself sent

            psid = item.get("sender", {}).get("id")
            if not psid:
                continue

            body = message.get("text")
            attachments = message.get("attachments") or []
            media_url = None
            if not body and attachments:
                first = attachments[0]
                body = f"[{first.get('type', 'attachment')}]"
                media_url = (first.get("payload") or {}).get("url")

            events.append(
                {
                    "external_id": message.get("mid"),
                    "psid": psid,
                    "body": body or "",
                    "media_url": media_url,
                }
            )
    return events
