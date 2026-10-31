"""Build and verify a Kervia macOS release on the owner's Mac.

No credentials are uploaded to GitHub. The Developer ID identity lives in a
temporary keychain for the duration of this command, then the previous user
keychain search list is restored. GitHub Release publication is a separate step.
"""

from __future__ import annotations

import argparse
import base64
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import shutil
import subprocess
import sys
import tempfile
from zipfile import ZipFile


REPO = Path(__file__).resolve().parents[3]
DESKTOP = REPO / "apps/desktop"
TEAM_ID = "HTYWD4RHSQ"
APP_NAME = "Hermes Desktop · Kervia Edition.app"


def run(*args: str, env: dict[str, str] | None = None) -> str:
    result = subprocess.run(args, env=env, capture_output=True, text=True,
                            check=False, timeout=300)
    if result.returncode:
        raise RuntimeError(f"{Path(args[0]).name} {args[1]} failed")
    return result.stdout


@contextmanager
def signing_identity(kit: Path, password_file: Path):
    password = password_file.read_text().rstrip("\r\n")
    if not password:
        raise RuntimeError("P12 password file is empty")
    os.umask(0o077)
    with tempfile.TemporaryDirectory(prefix="kervia-signing-") as directory:
        work = Path(directory)
        original = work / "original.p12"
        pem = work / "identity.pem"
        compatible = work / "compatible.p12"
        keychain = work / "signing.keychain-db"
        with ZipFile(kit) as archive:
            original.write_bytes(archive.read(
                "Kervia-Apple-Developer-Kit/certificats/Developer-ID-Application.p12"
            ))
        previous = shlex.split(run("security", "list-keychains", "-d", "user"))
        keychain_password = secrets.token_urlsafe(32)
        try:
            run("/usr/bin/openssl", "pkcs12", "-in", str(original), "-passin",
                f"file:{password_file}", "-nodes", "-out", str(pem))
            run("/usr/bin/openssl", "pkcs12", "-export", "-certpbe", "PBE-SHA1-3DES",
                "-keypbe", "PBE-SHA1-3DES", "-in", str(pem), "-passout",
                f"file:{password_file}", "-out", str(compatible))
            original.unlink()
            pem.unlink()
            run("security", "create-keychain", "-p", keychain_password, str(keychain))
            run("security", "unlock-keychain", "-p", keychain_password, str(keychain))
            run("security", "set-keychain-settings", str(keychain))
            run("security", "import", str(compatible), "-k", str(keychain), "-P", password,
                "-T", "/usr/bin/codesign", "-T", "/usr/bin/productbuild")
            compatible.unlink()
            run("security", "set-key-partition-list", "-S", "apple-tool:,apple:", "-s",
                "-k", keychain_password, str(keychain))
            identities = run("security", "find-identity", "-v", "-p", "codesigning", str(keychain))
            matches = re.findall(
                rf'\b([0-9A-Fa-f]{{40}}) "Developer ID Application: [^"\n]+ \({TEAM_ID}\)"',
                identities,
            )
            if len(matches) != 1:
                raise RuntimeError("Expected one Kervia Developer ID Application identity")
            run("security", "list-keychains", "-d", "user", "-s", str(keychain), *previous)
            yield matches[0]
        finally:
            subprocess.run(["security", "list-keychains", "-d", "user", "-s", *previous],
                           capture_output=True, check=False)
            subprocess.run(["security", "delete-keychain", str(keychain)],
                           capture_output=True, check=False)
            shutil.rmtree(work, ignore_errors=True)


def verify(version: str) -> None:
    app = DESKTOP / "release/mac-arm64" / APP_NAME
    release = DESKTOP / "release"
    dmg = release / f"HermesDesktopKerviaEdition-{version}-mac-arm64.dmg"
    zip_file = release / f"HermesDesktopKerviaEdition-{version}-mac-arm64.zip"
    for path in (app, dmg, zip_file, release / "stable-mac.yml",
                 release / f"{dmg.name}.blockmap", release / f"{zip_file.name}.blockmap"):
        if not path.exists():
            raise RuntimeError(f"Missing release artifact: {path.name}")
    if (app / "Contents/Resources/agent-payload").exists():
        raise RuntimeError("Desktop-only release contains an agent payload")
    identifier = run("plutil", "-extract", "CFBundleIdentifier", "raw", "-o", "-",
                     str(app / "Contents/Info.plist")).strip()
    if identifier != "ch.kervia.hermes-desktop":
        raise RuntimeError("Unexpected macOS bundle identifier")
    bundle_version = run("plutil", "-extract", "CFBundleShortVersionString", "raw", "-o", "-",
                         str(app / "Contents/Info.plist")).strip()
    if bundle_version != version:
        raise RuntimeError("Application version does not match release")
    stamp = json.loads((DESKTOP / "build/install-stamp.json").read_text())
    commit = run("git", "-C", str(REPO), "rev-parse", "HEAD").strip()
    if (stamp.get("dirty") or stamp.get("payload") != "light"
            or stamp.get("commit") != commit or stamp.get("displayVersion") != version):
        raise RuntimeError("Release stamp does not match the clean Desktop-only source")
    receipt = app / "Contents/Resources/app.asar.unpacked/dist/hermes-build.json"
    if not receipt.exists():
        raise RuntimeError("Missing packaged renderer build receipt")
    renderer_env = dict(json.loads(receipt.read_text())["inputs"]["env"])
    if renderer_env.get("KERVIA_DESKTOP_EDITION") != "1":
        raise RuntimeError("Packaged renderer is not the Kervia edition")
    feed = (release / "stable-mac.yml").read_text()
    if not feed.startswith(f"version: {version}\n"):
        raise RuntimeError("Update feed version does not match release")
    for artifact in (dmg, zip_file):
        digest = base64.b64encode(hashlib.sha512(artifact.read_bytes()).digest()).decode("ascii")
        if f"url: {artifact.name}\n    sha512: {digest}\n    size: {artifact.stat().st_size}" not in feed:
            raise RuntimeError(f"Update feed checksum does not match {artifact.name}")
    app_feed = (app / "Contents/Resources/app-update.yml").read_text()
    if "url: https://github.com/kerviaHerve/hermes-agent-desktop/releases/latest/download/" not in app_feed:
        raise RuntimeError("Packaged updater points to the wrong release feed")
    run("codesign", "--verify", "--deep", "--strict", str(app))
    run("xcrun", "stapler", "validate", str(app))
    run("spctl", "--assess", "--type", "execute", str(app))
    run("hdiutil", "verify", str(dmg))
    with tempfile.TemporaryDirectory(prefix="kervia-dmg-check-") as directory:
        mount = Path(directory) / "volume"
        mount.mkdir()
        run("hdiutil", "attach", "-readonly", "-nobrowse", "-mountpoint", str(mount), str(dmg))
        try:
            packaged_app = mount / APP_NAME
            run("codesign", "--verify", "--deep", "--strict", str(packaged_app))
            run("xcrun", "stapler", "validate", str(packaged_app))
            run("spctl", "--assess", "--type", "execute", str(packaged_app))
        finally:
            run("hdiutil", "detach", str(mount))
    print(f"Local version {version}: signed app in DMG, Apple ticket, Gatekeeper "
          "and checksum verified")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kit", type=Path, required=True)
    parser.add_argument("--password-file", type=Path, required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--notary-profile", default="Kaptivox-Notary")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version):
        raise RuntimeError("Version must be X.Y.Z")
    release_info = json.loads((DESKTOP / "kervia-release.json").read_text())
    if args.version != release_info["kerviaVersion"]:
        raise RuntimeError("Release version differs from kervia-release.json")
    if not args.verify_only:
        preflight = subprocess.run(
            [sys.executable, str(REPO / "scripts/kervia-release-preflight.py")],
            capture_output=True, text=True, check=False, timeout=90,
        )
        if preflight.returncode:
            raise RuntimeError(preflight.stderr.strip() or "Release preflight failed")
    with signing_identity(args.kit, args.password_file) as sha1:
        if not args.verify_only:
            sandbox = REPO / ".hermes-local-sandbox"
            sandbox.mkdir(exist_ok=True)
            log_path = sandbox / "kervia-local-release-build.log"
            env = os.environ.copy()
            env.update({
                "KERVIA_DESKTOP_EDITION": "1", "HERMES_DESKTOP_VARIANT": "light",
                "HERMES_PAYLOAD_TAG": f"v{args.version}", "HERMES_PAYLOAD_VERSION": args.version,
                "HERMES_PYTHON": sys.executable, "HERMES_HOME": str(sandbox / "hermes-home"),
                "GITHUB_REPOSITORY": "kerviaHerve/hermes-agent-desktop", "CSC_NAME": sha1,
                "APPLE_NOTARY_PROFILE": args.notary_profile,
            })
            env.pop("CSC_LINK", None)
            env.pop("CSC_KEY_PASSWORD", None)
            with log_path.open("w") as log:
                log_path.chmod(0o600)
                result = subprocess.run(["npm", "run", "dist:mac"], cwd=DESKTOP, env=env,
                                        stdout=log, stderr=subprocess.STDOUT, check=False,
                                        timeout=7200)
            if result.returncode:
                raise RuntimeError(f"Local build failed; inspect the private log at {log_path}")
        verify(args.version)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Kervia local release failed: {error}", file=sys.stderr)
        raise SystemExit(1)
