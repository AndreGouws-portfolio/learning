import re
import sqlite3

from flask import Blueprint, current_app, request

from ..db import get_db
from ..integrations import messenger, whatsapp

bp = Blueprint("webhooks", __name__, url_prefix="/webhooks")


def _digits(value):
    return re.sub(r"\D", "", value or "")


def _split_name(name, fallback):
    name = (name or "").strip()
    if not name:
        return fallback, ""
    parts = name.split(None, 1)
    return parts[0], (parts[1] if len(parts) > 1 else "")


def _find_or_create_whatsapp_contact(db, from_number, profile_name):
    digits = _digits(from_number)
    row = db.execute(
        "SELECT * FROM contacts WHERE whatsapp_number = ? OR phone LIKE ?",
        (digits, f"%{digits[-9:]}" if len(digits) >= 9 else digits),
    ).fetchone()
    if row:
        if not row["whatsapp_number"]:
            db.execute("UPDATE contacts SET whatsapp_number = ? WHERE id = ?", (digits, row["id"]))
        return row["id"]

    first, last = _split_name(profile_name, "WhatsApp Lead")
    cur = db.execute(
        "INSERT INTO contacts (first_name, last_name, phone, whatsapp_number, notes) "
        "VALUES (?, ?, ?, ?, ?)",
        (first, last, from_number, digits, "Auto-created from an inbound WhatsApp message."),
    )
    return cur.lastrowid


def _find_or_create_messenger_contact(db, psid):
    row = db.execute("SELECT id FROM contacts WHERE messenger_psid = ?", (psid,)).fetchone()
    if row:
        return row["id"]

    name = messenger.fetch_profile_name(psid)
    first, last = _split_name(name, "Messenger Lead")
    cur = db.execute(
        "INSERT INTO contacts (first_name, last_name, messenger_psid, notes) VALUES (?, ?, ?, ?)",
        (first, last, psid, "Auto-created from an inbound Messenger message."),
    )
    return cur.lastrowid


def _store_inbound(db, channel, contact_id, external_id, body, media_url):
    try:
        db.execute(
            "INSERT INTO messages (channel, direction, external_id, contact_id, body, media_url) "
            "VALUES (?, 'IN', ?, ?, ?, ?)",
            (channel, external_id, contact_id, body, media_url),
        )
    except sqlite3.IntegrityError:
        pass  # duplicate delivery of a webhook we've already processed


@bp.route("/whatsapp", methods=["GET"])
def whatsapp_verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge", "")
    if mode == "subscribe" and whatsapp.verify_token_matches(token):
        return challenge, 200
    return "Verification failed", 403


@bp.route("/whatsapp", methods=["POST"])
def whatsapp_receive():
    if not whatsapp.verify_signature(request.get_data(), request.headers.get("X-Hub-Signature-256")):
        current_app.logger.warning("Rejected WhatsApp webhook: bad signature")
        return "Invalid signature", 403

    payload = request.get_json(silent=True) or {}
    db = get_db()
    for event in whatsapp.parse_webhook_event(payload):
        if not event["from_number"]:
            continue
        contact_id = _find_or_create_whatsapp_contact(db, event["from_number"], event["name"])
        _store_inbound(db, "WHATSAPP", contact_id, event["external_id"], event["body"], event["media_url"])
    db.commit()
    return "", 200


@bp.route("/messenger", methods=["GET"])
def messenger_verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge", "")
    if mode == "subscribe" and messenger.verify_token_matches(token):
        return challenge, 200
    return "Verification failed", 403


@bp.route("/messenger", methods=["POST"])
def messenger_receive():
    if not messenger.verify_signature(request.get_data(), request.headers.get("X-Hub-Signature-256")):
        current_app.logger.warning("Rejected Messenger webhook: bad signature")
        return "Invalid signature", 403

    payload = request.get_json(silent=True) or {}
    db = get_db()
    for event in messenger.parse_webhook_event(payload):
        contact_id = _find_or_create_messenger_contact(db, event["psid"])
        _store_inbound(db, "MESSENGER", contact_id, event["external_id"], event["body"], event["media_url"])
    db.commit()
    return "", 200
