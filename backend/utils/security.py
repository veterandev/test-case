import uuid
import secrets

def generate_token():
    return str(uuid.uuid4())

def generate_qr_key():
    return secrets.token_urlsafe(8)