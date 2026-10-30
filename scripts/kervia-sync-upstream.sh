#!/usr/bin/env bash
# Compare the pinned Hermes source with upstream, or stage its changes on a new local branch.
set -euo pipefail

usage() {
  echo "Usage: scripts/kervia-sync-upstream.sh [--check|--apply]" >&2
  exit 2
}

mode="${1:---check}"
[[ $# -le 1 && ( "$mode" == "--check" || "$mode" == "--apply" ) ]] || usage

repo="$(git rev-parse --show-toplevel)"
cd "$repo"

upstream_url="$(git remote get-url upstream)"
case "$upstream_url" in
  git@github.com:NousResearch/hermes-agent.git|https://github.com/NousResearch/hermes-agent.git) ;;
  *) echo "Unexpected upstream remote: $upstream_url" >&2; exit 1 ;;
esac

base="$(python3 -c 'import json; print(json.load(open("apps/desktop/kervia-release.json"))["hermesSourceCommit"])')"
git cat-file -e "${base}^{commit}"
git fetch --filter=blob:none upstream main
head="$(git rev-parse upstream/main)"

if [[ "$base" == "$head" ]]; then
  echo "Hermes source is current: $head"
  exit 0
fi

if ! git merge-base --is-ancestor "$base" "$head"; then
  echo "Pinned source is not an ancestor of upstream/main. Review the upstream history before syncing." >&2
  exit 1
fi

echo "Pinned Hermes source: $base"
echo "Current upstream/main: $head"
echo "Commits since pinned source: $(git rev-list --count "${base}..${head}")"
echo "Changed paths:"
git diff --name-status "$base" "$head"

if [[ "$mode" == "--check" ]]; then
  echo "To stage this update on a new local branch, run: scripts/kervia-sync-upstream.sh --apply"
  exit 0
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Tracked files are not clean. Commit or restore them before applying an upstream update." >&2
  exit 1
fi

branch="sync/hermes-$(date +%Y-%m-%d)-${head:0:8}"
git switch -c "$branch"
patch="$(mktemp "${TMPDIR:-/tmp}/kervia-upstream.XXXXXX")"
trap 'rm -f "$patch"' EXIT
git diff --binary "$base" "$head" > "$patch"

if ! git apply --3way --index "$patch"; then
  echo "Upstream changes need manual conflict resolution on $branch. The released branch is untouched." >&2
  exit 1
fi

echo "Upstream changes staged on $branch. Test them before changing kervia-release.json or publishing."
