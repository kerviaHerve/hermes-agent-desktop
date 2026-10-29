#!/usr/bin/env bash
# Launch this fork's compiled Desktop with its own persistent local data and app lock.
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# A developer shell may contain overrides for an installed Hermes. The test
# Desktop must choose connections from its own userData instead.
unset HERMES_DESKTOP_REMOTE_URL HERMES_DESKTOP_REMOTE_TOKEN HERMES_DESKTOP_DEV_SERVER
unset HERMES_DESKTOP_HERMES HERMES_RUNTIME_DIR
unset HERMES_DESKTOP_VARIANT HERMES_PAYLOAD_TAG HERMES_BUILD_COMMIT
unset HERMES_DEV_SANDBOX_DIR HERMES_DEV_SANDBOX_NAME
export HERMES_DESKTOP_HERMES_ROOT="$repo_root"
export HERMES_DESKTOP_SKIP_PROTOCOL_REGISTRATION=1
export HERMES_DESKTOP_CDP_PORT=off

cd "$repo_root/apps/desktop"
# The compiled renderer loads from file://. A Vite localhost renderer sends a
# web Origin the remote gateway rejects on its WebSocket boundary.
exec "$repo_root/scripts/dev-sandbox.sh" --persistent -- npm run start
