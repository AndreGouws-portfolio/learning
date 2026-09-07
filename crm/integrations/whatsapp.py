"""WhatsApp Business Cloud API integration (Meta Graph API).

Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
"""

import hashlib
import hmac
import os

import requests

GRAPH_API_VERSION = "v21.0"


class WhatsAppError(Exception):
    """Raised when the Graph API rejects a send request."""


class WhatsAppNotConfigured(Exception):
    """Raised when required WhatsApp env vars are missing."""


def _config():
    token = os.environ.get("WHATSAPP_TOKEN")
    phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
    if not token or not phone_number_id:
        raise WhatsAppNotConfigured(
            "Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your .env file first."
        )
    return token, phone_number_id


def is_configured():
    return bool(os.environ.get("WHATSAPP_TOKEN") and os.environ.get("WHATSAPP_PHONE_NUMBER_ID"))


def send_text(to, body):
    """Send a freeform text message. `to` is a phone number, digits only (E.164 without '+')."""
    token, phone_number_id = _config()
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_number_id}/messages"
    resp = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        },
        timeout=15,
    )
    data = resp.json() if resp.content else {}
    if resp.status_code >= 400:
        error = data.get("error", {})
        raise WhatsAppError(error.get("message", f"WhatsApp API returned HTTP {resp.status_code}"))
    return data


def verify_signature(raw_body, signature_header):
    """Verify the X-Hub-Signature-256 header Meta sends with every webhook POST."""
    app_secret = os.environ.get("WHATSAPP_APP_SECRET") or os.environ.get("META_APP_SECRET")
    if not app_secret:
        # No secret configured - can't verify. Caller decides whether that's acceptable.
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.removeprefix("sha256="))


def verify_token_matches(token: str) -> bool:
    expected = os.environ.get("WHATSAPP_VERIFY_TOKEN")
    return bool(expected) and token == expected


def parse_webhook_event(payload: dict):
    """Extract normalized inbound messages from a WhatsApp webhook payload.

    Returns a list of dicts: {external_id, from_number, name, body, media_url}.
    Ignores status-update notifications (delivered/read receipts) - only
    actual inbound messages are returned.
    """
    events = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            if change.get("field") != "messages":
                continue

            profiles = {c.get("wa_id"): c.get("profile", {}).get("name") for c in value.get("contacts", [])}

            for msg in value.get("messages", []):
                body = None
                media_url = None
                msg_type = msg.get("type")
                if msg_type == "text":
                    body = msg.get("text", {}).get("body")
                elif msg_type in ("image", "video", "audio", "document", "sticker"):
                    media = msg.get(msg_type, {})
                    body = media.get("caption") or f"[{msg_type}]"
                    media_url = media.get("id")  # media needs a follow-up API call to fetch a URL
                elif msg_type == "button":
                    body = msg.get("button", {}).get("text")
                elif msg_type == "interactive":
                    interactive = msg.get("interactive", {})
                    reply = interactive.get("button_reply") or interactive.get("list_reply") or {}
                    body = reply.get("title")
                else:
                    body = f"[unsupported message type: {msg_type}]"

                events.append(
                    {
                        "external_id": msg.get("id"),
                        "from_number": msg.get("from"),
                        "name": profiles.get(msg.get("from")),
                        "body": body,
                        "media_url": media_url,
                    }
                )
    return events
