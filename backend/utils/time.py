import datetime

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

from datetime import timezone

def ensure_utc(dt):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt