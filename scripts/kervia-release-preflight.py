#!/usr/bin/env python3
"""Verify a Kervia release against the declared official Hermes tag."""

from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.request import Request, urlopen


REPO = Path(__file__).resolve().parents[1]
RELEASE = REPO / "apps/desktop/kervia-release.json"


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(REPO), *args],
        capture_output=True, text=True, check=False, timeout=60,
    )
    if result.returncode:
        raise RuntimeError(f"git {args[0]} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def check() -> None:
    metadata = json.loads(RELEASE.read_text(encoding="utf-8-sig"))
    version = metadata["kerviaVersion"]
    source = metadata["hermesSourceCommit"]
    hermes_version = metadata["hermesVersion"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise RuntimeError("Kervia version must be X.Y.Z")
    if not re.fullmatch(r"[0-9a-f]{40}", source):
        raise RuntimeError("Hermes source must be a full commit SHA")
    if not re.fullmatch(r"\d+\.\d+\.\d+", hermes_version):
        raise RuntimeError("Hermes version must be X.Y.Z")

    remote = git("remote", "get-url", "upstream")
    if remote not in (
        "git@github.com:NousResearch/hermes-agent.git",
        "https://github.com/NousResearch/hermes-agent.git",
    ):
        raise RuntimeError("The upstream remote is not NousResearch/hermes-agent")
    if git("status", "--porcelain", "--untracked-files=no"):
        raise RuntimeError("Commit tracked changes before the release preflight")
    if git("tag", "--list", f"kervia-v{version}"):
        raise RuntimeError(f"Kervia version {version} already has a local tag")
    if not git("cat-file", "-t", source) == "commit":
        raise RuntimeError("Pinned Hermes source is not a commit")

    readme = (REPO / "README.md").read_text(encoding="utf-8-sig")
    changelog = (REPO / "CHANGELOG-KERVIA.md").read_text(encoding="utf-8-sig")
    if f"**Version {version}**" not in readme or f"Hermes v{hermes_version}" not in readme or source[:7] not in readme:
        raise RuntimeError("README version or Hermes source is not updated")
    if f"## Kervia {version} · Hermes v{hermes_version} · Hermes source `{source}`" not in changelog:
        raise RuntimeError("Changelog version or Hermes source is not updated")

    tag = f"v{hermes_version}"
    lines = git("ls-remote", "https://github.com/NousResearch/hermes-agent.git", f"refs/tags/{tag}^{{}}").splitlines()
    if len(lines) != 1:
        raise RuntimeError(f"Could not verify the official Hermes {tag} tag")
    tagged = lines[0].split()[0]
    if source != tagged:
        raise RuntimeError(
            f"Hermes source differs from official {tag}: pinned {source[:12]}, tag {tagged[:12]}"
        )
    if git("rev-parse", f"{tag}^{{commit}}") != source:
        raise RuntimeError(f"Local Hermes {tag} tag does not match the pinned source")
    request = Request(
        "https://api.github.com/repos/NousResearch/hermes-agent/releases/latest",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "Kervia-release-preflight"},
    )
    with urlopen(request, timeout=30) as response:
        latest_release = json.load(response)["tag_name"]
    if latest_release != tag:
        raise RuntimeError(f"Hermes {tag} is no longer the latest official release ({latest_release})")
    print(f"Source gate passed: Kervia {version} integrates latest official Hermes {tag} ({source})")
    print("Automated, runtime, signing and update gates remain mandatory.")


if __name__ == "__main__":
    try:
        check()
    except (KeyError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(f"Kervia release preflight failed: {error}", file=sys.stderr)
        raise SystemExit(1)
