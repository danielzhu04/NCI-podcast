import json
import os

import dotenv
import openai

dotenv.load_dotenv()

client = openai.Client(
    api_key=os.getenv("OPENAI_API_KEY"),
)

SYSTEM_PROMPT = """
You are part of a podcast hosted by two AI hosts:

1. TRINITY — analytical, structured, paper-focused.
2. AXIOM — curious, interdisciplinary, likes to debate and question Trinity.

They are discussing a scientific paper assigned.

Format each line EXACTLY like this:
TRINITY: [dialogue here]
AXIOM: [dialogue here]

Rules:
- Dialogue only, no stage directions unless noted as [SFX: description]
- Make it sound like a real, natural podcast conversation
- Include explanations of methods, math, and biological relevance in an accessible way
- Allow for lively debate and discussion of strengths and weaknesses of the paper
- Do not reference outside sources other than the publication/paper you've been given
- The final script MUST be between 750 and 850 words total; count all dialogue words, and NEVER exceed 850 words
- The name of the podcast is "NCI Signal", but only mention this in the intro
- At the start of the episode, both hosts must introduce themselves by name (Trinity and Axiom) and
say they cover high-impact cancer papers supported by the National Cancer Institute. Only one host
should say the full National Cancer Institute name; the other can say "NCI" for brevity.
- If NCI grant IDs are provided, mention exactly one of them once, spoken in broken form
  (example: U24CA264250 becomes "U-24 C-A 2-6-4-2-5-0").
- Include a short segment on what the paper shared for reuse — datasets, code, software, or tools —
and how a listener could actually use those outputs. If nothing reusable was shared, say that plainly.
- Make sure to end the script with a closing statement from both hosts, thanking the audience for listening, and
saying something along the lines of: we'll see you next episode on NCI Signal to discuss another high-impact NCI-supported paper!

After generating the script, also extract from the PDF:
- title: the paper's actual title, exactly as written
- description: a 2-3 sentence, non-technical summary of the paper suitable for a podcast episode description
- tags: an array of 3-5 relevant topic tags (lowercase, single words or short phrases)

Respond ONLY with valid JSON in this exact shape, no other text, no markdown formatting:
{"script": "...", "title": "...", "description": "...", "tags": ["...", "..."]}
"""


def generate_script(pdf_base64: str, nci_grants=None, journal=None, outputs=None) -> dict:
    """
    Takes a path to a pdf file, and returns a dictionary/hashmap with keys for the script, title, description, and tags.
    """
    grants = nci_grants or []
    outputs = outputs or []
    grant_line = ", ".join(grants) if grants else "none provided"
    output_line = (
        "; ".join(f"{item.get('type')}: {item.get('id')}" for item in outputs)
        if outputs
        else "none found in metadata"
    )
    journal_line = journal or "unknown"

    paper_prompt = f"""
Hello Trinity and Axiom,

You have been assigned a new paper to discuss on NCI Signal.

Known metadata (use this; do not invent extra grants or repositories):
- Journal: {journal_line}
- NCI grant IDs: {grant_line}
- Shared outputs: {output_line}

Your task:
- Summarize the paper
- Discuss key methods
- Explain biological relevance
- Engage in lively debate on the strengths and weaknesses of the paper and its methods
- Discuss what was shared for reuse, or the lack of shared outputs
- Don't be too boring or technical; ensure to explain abstract concepts simply and clearly
- Don't use overly complex jargon; but if you do, explain it in simple terms immediately after

Keep it very understandable AND accessible to an amateur audience.
"""

    response = client.responses.create(
        model="gpt-5.5-2026-04-23",
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {
                    "type": "input_file",
                    "filename": "paper.pdf",
                    "file_data": f"data:application/pdf;base64,{pdf_base64}",
                    "detail": "high",
                    },
                    {
                        "type": "input_text",
                        "text": paper_prompt,
                    },
                ]
            },
        ],
    )

    # Creates a dictionary from the JSON output of the response,
    # which contains the script, title, description, and tags
    return json.loads(response.output_text)
