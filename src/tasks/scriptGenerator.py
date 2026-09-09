import os
import json
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
- The name of the podcast is the "Genome Lens", but only mention this in the intro
- At the start of the episode, both hosts must introduce themselves by name (Trinity and Axiom) and
mention their affiliation with the Ma'ayan Lab for Computational Systems Biology at the Icahn School of Medicine
at Mount Sinai in New York City. Only one host should say the full affiliation, and the other should 
say "Ma'ayan Lab" for brevity.
- Make sure to end the script with a closing statement from both hosts, thanking the audience for listening, and
saying something along the lines of: we'll see you next epsiode on the Genome Lens to discuss another exciting paper!

After generating the script, also extract from the PDF:
- title: the paper's actual title, exactly as written
- description: a 2-3 sentence, non-technical summary of the paper suitable for a podcast episode description
- tags: an array of 3-5 relevant topic tags (lowercase, single words or short phrases)

Respond ONLY with valid JSON in this exact shape, no other text, no markdown formatting:
{"script": "...", "title": "...", "description": "...", "tags": ["...", "..."]}
"""

def generate_script(pdf_base64: str) -> dict:
    """
    Takes a path to a pdf file, and returns a dictionary/hashmap with keys for the script, title, description, and tags.
    """

    paper_prompt = f"""
Hello Trinity and Axiom,

You have been assigned a new paper to discuss in your podcast.

Your task:
- Summarize the paper
- Discuss key methods
- Explain biological relevance
- Engage in lively debate on the strengths and weaknesses of the paper and its methods
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