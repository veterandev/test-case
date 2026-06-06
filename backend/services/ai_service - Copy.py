import uuid

from services.session_store import sessions
from prompts.prompts import render_prompt

def classify_answer(text: str):

    text = text.strip()

    if len(text) > 80:
        return "Fully Addressed"

    if len(text) > 20:
        return "Partial Response"

    return "Sanity Warning"


def create_gap_session(text, metadata, format):

    gaps = [
        "Clarify the primary objective behind the initiative described.",
        "What were the key performance indicators (KPIs) for this initiative?",
        "Who are the main stakeholders to consider for this narrative?",
    ]

    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "text": text,
        "gaps": gaps,
        "metadata": metadata,
        "format": format,
    }

    return session_id, gaps


def finalize_session(session_id, answers):

    session = sessions.get(session_id)

    if not session:
        return None

    statuses = [classify_answer(a) for a in answers]

    clean_answers = [a.strip() for a in answers if a.strip()]

    joined_answers = " | ".join(clean_answers) if clean_answers else "No answers provided."

    return statuses, joined_answers
