from datetime import date, datetime


def currency(value):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "R0"
    return f"R{value:,.0f}"


def pretty_date(value):
    if not value:
        return "—"
    if isinstance(value, str):
        value = value[:10]
        try:
            value = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return value
    if not hasattr(value, "strftime"):
        return str(value)
    # Avoid %-d / %#d (no-leading-zero day) - those are platform-specific
    # strftime extensions (glibc only) and raise ValueError on Windows.
    return f"{value.strftime('%b')} {value.day}, {value.year}"


def initials(name):
    parts = [p for p in (name or "").split() if p]
    return "".join(p[0].upper() for p in parts[:2])


def is_overdue(due_date):
    if not due_date:
        return False
    try:
        d = datetime.strptime(due_date[:10], "%Y-%m-%d").date()
    except ValueError:
        return False
    return d < date.today()


def init_app(app):
    app.jinja_env.filters["currency"] = currency
    app.jinja_env.filters["pretty_date"] = pretty_date
    app.jinja_env.filters["initials"] = initials
    app.jinja_env.filters["is_overdue"] = is_overdue
    app.jinja_env.globals["today"] = lambda: date.today().isoformat()
