#!/usr/bin/env python3
"""Refuse a Kervia release whose Hermes source is no longer current."""

from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess
import sys


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
    metadata = json.loads(RELEASE.read_text())
    version = metadata["kerviaVersion"]
    source = metadata["hermesSourceCommit"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise RuntimeError("Kervia version must be X.Y.Z")
    if not re.fullmatch(r"[0-9a-f]{40}", source):
        raise RuntimeError("Hermes source must be a full commit SHA")

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

    readme = (REPO / "README.md").read_text()
    changelog = (REPO / "CHANGELOG-KERVIA.md").read_text()
    if f"**Version {version}**" not in readme or source[:7] not in readme:
        raise RuntimeError("README version or Hermes source is not updated")
    if f"## Kervia {version} · Hermes source `{source}`" not in changelog:
        raise RuntimeError("Changelog version or Hermes source is not updated")

    lines = git("ls-remote", "upstream", "refs/heads/main").splitlines()
    if len(lines) != 1:
        raise RuntimeError("Could not verify the current official Hermes revision")
    latest = lines[0].split()[0]
    if source != latest:
        raise RuntimeError(
            f"Hermes source is not current: pinned {source[:12]}, upstream {latest[:12]}"
        )
    print(f"Source gate passed: Kervia {version} integrates current Hermes {source}")
    print("Automated, runtime, signing and update gates remain mandatory.")


if __name__ == "__main__":
    try:
        check()
    except (KeyError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(f"Kervia release preflight failed: {error}", file=sys.stderr)
        raise SystemExit(1)
