#!/usr/bin/env bash
# Run this checkout against a local Hermes runtime confined to its own home.
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

unset HERMES_DESKTOP_REMOTE_URL HERMES_DESKTOP_REMOTE_TOKEN HERMES_DESKTOP_DEV_SERVER
unset HERMES_DESKTOP_HERMES HERMES_DESKTOP_PYTHON
unset HERMES_DESKTOP_VARIANT HERMES_PAYLOAD_TAG HERMES_BUILD_COMMIT
export HERMES_DESKTOP_HERMES_ROOT="$repo_root"
export HERMES_DESKTOP_SKIP_PROTOCOL_REGISTRATION=1
export HERMES_DESKTOP_CDP_PORT=off
export HERMES_DEV_SANDBOX_DIR=.hermes-local-sandbox
export HERMES_DEV_SANDBOX_NAME=HermesLocalSandbox
export HERMES_RUNTIME_DIR="$repo_root/.hermes-local-sandbox/hermes-home/tools"

cd "$repo_root"
exec "$repo_root/scripts/dev-sandbox.sh" --persistent -- \
  "$repo_root/scripts/run-in-hermes-env" bash -c '
    set -euo pipefail
    export HERMES_DESKTOP_PYTHON="$(command -v python)"
    cd "$1/apps/desktop"
    exec npm run start
  ' bash "$repo_root"
