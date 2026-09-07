def safe_next(value, default):
    """Only allow redirecting to a local path, never an absolute URL."""
    if value and value.startswith("/") and not value.startswith("//"):
        return value
    return default
