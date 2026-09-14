import os
import dotenv
import openai
from pathlib import Path


dotenv.load_dotenv()


client = openai.Client(
   base_url=os.getenv("OPENAI_BASE_URL"),
   api_key=os.getenv("OPENAI_API_KEY"),
)

# List available models to verify connection
# models = client.models.list()


# for model in models.data:
#     print(model.id)

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
at Mount Sinai in New York City
"""


with open("GSFM_input.txt", "r") as f:
   paper_text = f.read()


PAPER_PROMPT = f"""
Hello Trinity and Axiom,


You have been assigned a new paper to discuss in your podcast.


Paper:
{paper_text}


Your task:
- Summarize the paper
- Discuss key methods
- Explain biological relevance
- Engage in lively debate on the strengths and weaknesses of the paper and its methods
- Don't be too boring or technical; ensure to explain abstract concepts simply and clearly
- Don't use overly complex jargon; but if you do, explain it in simple terms immediately after


Keep it very understandable AND accessible to an amateur audience.
"""


# Combine system and user prompts to create the podcast script.
# Use the client to generate the script based on the prompts.
script_response = client.responses.create(
   model="gpt-oss-20b",
   input=[
       {"role": "system", "content": SYSTEM_PROMPT},
       {"role": "user", "content": PAPER_PROMPT},
   ],
)


# Set the generated script to a variable
script = script_response.output_text


with open("GSFM_script.txt", "w") as f:
   f.write(script)


print("Saved podcast script as .txt file")