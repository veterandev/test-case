import json
from openai import OpenAI

client = OpenAI()


def call_llm(prompt: str, model: str = "gpt-4.1"):

    response = client.responses.create(
        model=model,
        input=prompt,
        temperature=0.2
    )

    text = response.output_text

    try:
        parsed = json.loads(text)
    except Exception:
        parsed = None

    return text, parsed
