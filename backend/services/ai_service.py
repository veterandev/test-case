import uuid
import json
import re
import time

from core.config import openai_client
from services.session_store import sessions
from prompts.prompts import render_prompt, SYNTHESIS_PROMPT, INTEGRATING_PROMPT, FINALIZE_PROMPT
from models.llm_schemas import SynthesisDecision
from pydantic import ValidationError


def safe_json_parse(content: str):

    if not content:
        return None

    content = content.strip()

    # -------------------------
    # 1️⃣ remove markdown fences
    # -------------------------

    if content.startswith("```"):
        match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
        if match:
            content = match.group(1).strip()

    # -------------------------
    # 2️⃣ try normal parse
    # -------------------------
        try:
            return json.loads(content)
        except Exception: pass

    # -------------------------
    # 3️⃣ extract first JSON block
    # -------------------------

    start = content.find("{")

    if start == -1:
        print("No JSON object found in LLM output")
        return None

    stack = 0
    end = None

    for i in range(start, len(content)):

        if content[i] == "{":
            stack += 1

        elif content[i] == "}":
            stack -= 1
        
        if stack == 0:
            end = i + 1
            break

    if end is None:
        print("JSON braces not balanced")
        return None

    json_str = content[start:end]

    try:
        return json.loads(json_str)

    except Exception as e:
        print("Final JSON parse failed:", e)
        print("Extracted JSON:", json_str)
        return None


def classify_answer(text: str):

    text = text.strip()

    if len(text) > 80:
        return "Fully Addressed"

    if len(text) > 20:
        return "Partial Response"

    return "Sanity Warning"


def build_synthesis_prompt(text, metadata, format):

    metadata = metadata or {}

    prompt = render_prompt(
        SYNTHESIS_PROMPT,
        user_transcript=text,
        output_format=format or "General Narrative",
        TA=json.dumps(metadata.get("targetAudience", "General")),
        industry=json.dumps(metadata.get("industry", "General")),
        output_length=json.dumps(metadata.get("length", "Medium")),
        TOV=json.dumps(metadata.get("tone", "Professional")),
        lang=json.dumps("English"),
        NDA=json.dumps(metadata.get("ndaLevel", "Standard")),
        extra=json.dumps("Nothing"),
    )

    return prompt


def run_llm_synthesis(text, metadata, format):

    if openai_client is None:
        return None

    prompt = build_synthesis_prompt(text, metadata, format)
#    print("Prompt 1:", prompt)

    for attempt in range(2):  # one retry

        start = time.time()

        try:
            resp = openai_client.chat.completions.create(
                model="gemini-2.5-flash-lite",
                messages=[
                    {"role": "system", "content": "Return ONLY valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            
            latency = time.time() - start
            usage = resp.usage
            print("LLM_LATENCY:", latency)
            print("TOKENS:", usage.total_tokens)

            content = resp.choices[0].message.content
    #        print("LLM_Synt_Resp:", content)

            data = safe_json_parse(content)
    #        print("LLM_Synt_Resp_Json:", data)

            return data

        except Exception as e:
            print("LLM synthesis error:", e)
            return None

"""         if not data:
            return None

        try:
            validated = SynthesisDecision(**data)
            return validated

        except ValidationError as e:
            print("LLM schema validation failed:", e)
            return None

#        print(f"Retrying LLM... attempt {attempt + 1}")

    return None
 """

def run_llm_integration(session, answers):

    text = session["text"]
    gaps = session["gaps"]
    metadata = session["metadata"] or {}
    format = session["format"]

    qa_pairs = []

    for i, q in enumerate(gaps):
        ans = answers[i] if i < len(answers) else ""
        qa_pairs.append({
            "question": q,
            "answer": ans
        })

    qa_json = json.dumps(qa_pairs)

    prompt = render_prompt(
        INTEGRATING_PROMPT,
        user_transcript=text,
        output_format=format or "General Narrative",
        TA=json.dumps(metadata.get("targetAudience", "General")),
        industry=json.dumps(metadata.get("industry", "General")),
        output_length=json.dumps(metadata.get("length", "Medium")),
        TOV=json.dumps(metadata.get("tone", "Professional")),
        lang=json.dumps("English"),
        NDA=json.dumps(metadata.get("ndaLevel", "Standard")),
        extra=json.dumps("Nothing"),
        Q_A=qa_json
    )
    print("Prompt 2:", prompt)

    try:

        resp = openai_client.chat.completions.create(
            model="gemini-2.5-flash-lite",
            messages=[
                {"role": "system", "content": "Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        content = resp.choices[0].message.content
        print("LLM_Integr_Resp:", content)

        data = safe_json_parse(content)
        print("LLM_Integr_Resp_Json:", data)

        return data

    except Exception as e:

        print("Integration LLM error:", e)
        return None


def create_gap_session(text, metadata, format, llm_questions=None):

    gaps = llm_questions or [
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

    llm_result = run_llm_integration(session, answers)

    if not llm_result:
        return statuses, None

    return statuses, llm_result
