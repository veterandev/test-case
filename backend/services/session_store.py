
from typing import Dict, Any

#sessions: Dict[str, dict] = {}

# ephemeral store
sessions: Dict[str, Dict[str, Any]] = {}

def get_session(session_id: str):
    return sessions.get(session_id)

def save_session(session_id: str, data: Dict[str, Any]):
    if session_id not in sessions:
        sessions[session_id] = {}
    sessions[session_id].update(data)
