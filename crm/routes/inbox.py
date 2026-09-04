from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import get_db
from ..integrations import messenger, whatsapp

bp = Blueprint("inbox", __name__, url_prefix="/inbox")


@bp.route("/")
def index():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.id, c.first_name, c.last_name, c.whatsapp_number, c.messenger_psid,
               m.body AS last_body, m.channel AS last_channel, m.direction AS last_direction,
               m.created_at AS last_at,
               (SELECT COUNT(*) FROM messages WHERE contact_id = c.id AND direction = 'IN' AND read_at IS NULL) AS unread
        FROM contacts c
        JOIN messages m ON m.id = (
            SELECT id FROM messages WHERE contact_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
        )
        ORDER BY m.created_at DESC
        """
    ).fetchall()
    return render_template("inbox/list.html", conversations=rows)


@bp.route("/<int:contact_id>")
def thread(contact_id):
    db = get_db()
    contact = db.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
    if contact is None:
        return render_template("404.html"), 404

    messages = db.execute(
        "SELECT * FROM messages WHERE contact_id = ? ORDER BY created_at, id", (contact_id,)
    ).fetchall()

    db.execute(
        "UPDATE messages SET read_at = datetime('now') "
        "WHERE contact_id = ? AND direction = 'IN' AND read_at IS NULL",
        (contact_id,),
    )
    db.commit()

    available_channels = []
    if contact["whatsapp_number"]:
        available_channels.append("WHATSAPP")
    if contact["messenger_psid"]:
        available_channels.append("MESSENGER")

    last_inbound_channel = None
    for m in reversed(messages):
        if m["direction"] == "IN":
            last_inbound_channel = m["channel"]
            break

    return render_template(
        "inbox/thread.html",
        contact=contact,
        messages=messages,
        available_channels=available_channels,
        default_channel=last_inbound_channel or (available_channels[0] if available_channels else None),
    )


@bp.route("/<int:contact_id>/send", methods=["POST"])
def send(contact_id):
    db = get_db()
    contact = db.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
    if contact is None:
        return render_template("404.html"), 404

    channel = request.form.get("channel")
    body = request.form.get("body", "").strip()

    if not body:
        return redirect(url_for("inbox.thread", contact_id=contact_id))

    try:
        if channel == "WHATSAPP":
            if not contact["whatsapp_number"]:
                raise ValueError("This contact has no WhatsApp number on file.")
            whatsapp.send_text(contact["whatsapp_number"], body)
        elif channel == "MESSENGER":
            if not contact["messenger_psid"]:
                raise ValueError("This contact has no Messenger PSID on file.")
            messenger.send_text(contact["messenger_psid"], body)
        else:
            raise ValueError("Choose a channel to send on.")

        db.execute(
            "INSERT INTO messages (channel, direction, contact_id, body, status) "
            "VALUES (?, 'OUT', ?, ?, 'sent')",
            (channel, contact_id, body),
        )
        db.commit()
    except (whatsapp.WhatsAppNotConfigured, messenger.MessengerNotConfigured) as e:
        flash(f"Not configured: {e}")
    except (whatsapp.WhatsAppError, messenger.MessengerError, ValueError) as e:
        flash(f"Message not sent: {e}")

    return redirect(url_for("inbox.thread", contact_id=contact_id))
