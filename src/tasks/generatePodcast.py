import re
import subprocess
import json
from pathlib import Path
from datetime import date
from .scriptGenerator import generate_script
from .audioGenerator import generate_audio


S3_BUCKET = "axiom-podcasts"
S3_REMOTE = "maayanlab"   

def titleFix(title: str) -> str:
    """
    Helper method that removes anything that is not a letter or number, and converts spaces into underscores
    """
    title = re.sub(r"[^a-zA-Z0-9 ]", "", title)
    title = title.replace(" ", "_")
    return title

def loadManifest() -> list:
    """
    Downloads and parses the current manifest.json from S3
    """
    local_manifest = Path("/tmp/manifest.json")
    subprocess.run(
        ["rclone", "copyto", f"{S3_REMOTE}:{S3_BUCKET}/manifest.json", str(local_manifest)],
        check=True, capture_output=True, text=True)
    with open(local_manifest, "r") as f:
        return json.load(f)
    
def saveManifest(manifest: list):
    """
    Writes the manifest to a local temporary file and uploads it back to S3
    """
    local_manifest = Path("/tmp/manifest.json")
    with open(local_manifest, "w") as f:
        json.dump(manifest, f, indent=2)
    subprocess.run(
        ["rclone", "copyto", str(local_manifest), f"{S3_REMOTE}:{S3_BUCKET}/manifest.json"],
        check=True, capture_output=True, text=True)
    
def addEpisode(episode_entry: dict):
    """
    Adds a new episode to the front of the manifest file and saves it
    """
    manifest = loadManifest()
    episode_entry["episode_number"] = len(manifest) + 1
    manifest.insert(0, episode_entry)
    saveManifest(manifest)

def publishEpisode(episode_id: str, title: str = None, description: str = None, tags: list = None) -> dict:
    """
    Finds an episode by id, updates its edited title/description/tags,
    marks it as published by changing the boolean field, and saves it to the manifest
    """
    manifest = loadManifest()
    matches = [x for x in manifest if x["id"] == episode_id]
    episode = matches[0] if matches else None
    if episode is None:
        raise ValueError(f"Episode not found: {episode_id}")

    if title is not None:
        episode["title"] = title
    if description is not None:
        episode["description"] = description
    if tags is not None:
        episode["tags"] = tags
    episode["published"] = True

    saveManifest(manifest)
    return episode

def generate(pdf_base64: str, publication_url: str, tool_url: str, image_url: str) -> str:
    """
    Core method that generates the script, makes the audio, uploads the podcast .mp3 file to 
    the s3 bucket, appends to the manifest.json file, and then returns the podcast url for the episode
    """
    result = generate_script(pdf_base64)
    script_text = result["script"]
    paper_title = result["title"]
    description = result["description"]
    tags = result["tags"]

    fixed_title = titleFix(paper_title)
    filename = f"{fixed_title}.mp3"
    mp3_file_path = Path("/tmp") / filename
    task_dir = Path(__file__).parent
    intro_path = task_dir / "intro.mp3"
    outro_path = task_dir / "outro.mp3"
    
    generate_audio(script_text, mp3_file_path, intro_path, outro_path)

    # Upload the generated podcast mp3 file to the s3 bucket
    remote_path = f"{S3_REMOTE}:{S3_BUCKET}"
    result_upload = subprocess.run(["rclone", "copy", mp3_file_path, remote_path],
            capture_output=True, text=True)
    
    # Check if s3 bucket upload was successful
    if result_upload.returncode != 0:
        raise RuntimeError("s3 upload failed: " + result_upload.stderr)
    
    podcast_url = f"https://s3.k8s.maayanlab.cloud/{S3_BUCKET}/{filename}"

    # Update the manifest.json file with the new episode entry
    episode_entry = {
        "id": f"{fixed_title}-podcast",
        "title": paper_title,
        "paper_title": paper_title,
        "description": description,
        "hosts": "Axiom & Trinity",
        "publish_date": date.today().isoformat(),
        "duration": None,
        "recording_url": podcast_url,
        "publication_url": publication_url,
        "tool_url": tool_url,
        "image_url": image_url,
        "tags": tags or [],
        "published": False,
    }
    addEpisode(episode_entry)
    return podcast_url
