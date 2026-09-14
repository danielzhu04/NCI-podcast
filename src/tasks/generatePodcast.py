import json
import os
import re
import subprocess
from datetime import date
from pathlib import Path
from typing import Optional

from .audioGenerator import generate_audio
from .scriptGenerator import generate_script


S3_BUCKET = os.getenv("S3_BUCKET", "axiom-podcasts")
S3_REMOTE = os.getenv("S3_REMOTE", "maayanlab")
S3_PREFIX = os.getenv("S3_PREFIX", "nci-signal")
S3_PUBLIC_BASE = os.getenv(
    "S3_PUBLIC_BASE",
    f"https://s3.k8s.maayanlab.cloud/{S3_BUCKET}",
)


def titleFix(title: str) -> str:
    """
    Helper method that removes anything that is not a letter or number, and converts spaces into underscores
    """
    title = re.sub(r"[^a-zA-Z0-9 ]", "", title)
    title = title.replace(" ", "_")
    return title


def _manifest_remote() -> str:
    return f"{S3_REMOTE}:{S3_BUCKET}/{S3_PREFIX}/manifest.json"


def _object_remote() -> str:
    return f"{S3_REMOTE}:{S3_BUCKET}/{S3_PREFIX}"


def _public_url(filename: str) -> str:
    return f"{S3_PUBLIC_BASE}/{S3_PREFIX}/{filename}"


def loadManifest() -> list:
    """
    Downloads and parses the current manifest.json from S3.
    A missing prefix/manifest starts a new catalog instead of failing.
    """
    local_manifest = Path("/tmp/nci-signal-manifest.json")
    result = subprocess.run(
        ["rclone", "copyto", _manifest_remote(), str(local_manifest)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not local_manifest.exists():
        return []
    with open(local_manifest, "r") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def saveManifest(manifest: list):
    """
    Writes the manifest to a local temporary file and uploads it back to S3
    """
    local_manifest = Path("/tmp/nci-signal-manifest.json")
    with open(local_manifest, "w") as f:
        json.dump(manifest, f, indent=2)
    result = subprocess.run(
        ["rclone", "copyto", str(local_manifest), _manifest_remote()],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("s3 manifest upload failed: " + result.stderr)


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


def generate(
    pdf_base64: str,
    publication_url: str,
    tool_url: str,
    image_url: str,
    pmid: str = "",
    doi: str = "",
    journal: str = "",
    nci_grants: Optional[list] = None,
    impact: Optional[dict] = None,
    outputs: Optional[list] = None,
) -> str:
    """
    Core method that generates the script, makes the audio, uploads the podcast .mp3 file to
    the s3 bucket, appends to the manifest.json file, and then returns the podcast url for the episode
    """
    nci_grants = nci_grants or []
    impact = impact or {}
    outputs = outputs or []

    result = generate_script(
        pdf_base64,
        nci_grants=nci_grants,
        journal=journal,
        outputs=outputs,
    )
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

    result_upload = subprocess.run(
        ["rclone", "copy", mp3_file_path, _object_remote()],
        capture_output=True,
        text=True,
    )

    if result_upload.returncode != 0:
        raise RuntimeError("s3 upload failed: " + result_upload.stderr)

    podcast_url = _public_url(filename)
    episode_id = f"pmid-{pmid}-podcast" if pmid else f"{fixed_title}-podcast"

    episode_entry = {
        "id": episode_id,
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
        "pmid": pmid or "",
        "doi": doi or "",
        "journal": journal or "",
        "nci_grants": nci_grants,
        "impact": impact,
        "outputs": outputs,
    }
    addEpisode(episode_entry)
    return podcast_url
