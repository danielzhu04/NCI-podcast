from playwright.sync_api import sync_playwright, Page
from dotenv import load_dotenv
import os


load_dotenv()
EMAIL = os.getenv("CHATGPT_EMAIL")
PASSWORD = os.getenv("CHATGPT_PASSWORD")


# Tries to login
def auto_login(page: Page):
   page.goto("https://chatgpt.com")
   page.get_by_test_id("login-button").click()
   page.get_by_label("Email address").fill(EMAIL)
   page.get_by_role("button", name="Continue", exact=True).click()
   page.get_by_label("Password").fill(PASSWORD)
   page.get_by_role("button", name="Continue", exact=True).click()
   print("Logged in successfully.")


def generate_podcast_script(page: Page, prompt: str) -> str:
   chat_box = page.get_by_role("textbox")
   chat_box.fill(prompt)
   chat_box.press("Enter")
   input("Wait for ChatGPT to finish, then press Enter...")
   assistant_messages = page.locator("[data-message-author-role='assistant']")
   return assistant_messages.last.inner_text()


playwright = sync_playwright().start()
browser = playwright.chromium.launch(headless=False)
context = browser.new_context()
page = context.new_page()


auto_login(page)


with open("GSFM_input.txt", "r") as f:
   paper_text = f.read()


prompt = f"""
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


Hello Trinity and Axiom, you have been assigned a new paper to discuss in your podcast.


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


script = generate_podcast_script(page, prompt)


with open("auto_podcast_script.txt", "w") as f:
   f.write(script)


print("Script saved to auto_podcast_script.txt")


browser.close()
playwright.stop()