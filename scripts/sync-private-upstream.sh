#!/usr/bin/env bash
# Import the official source tree onto the fork's snapshot branch.
# Deliberately leaves main untouched; review and merge the snapshot separately.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
snapshot_branch=upstream-snapshot

case "$(git -C "$repo_root" remote get-url origin)" in
  git@github.com:kerviaHerve/hermes-agent-desktop.git|https://github.com/kerviaHerve/hermes-agent-desktop.git) ;;
  *) echo "origin is not the expected private repository" >&2; exit 1 ;;
esac
case "$(git -C "$repo_root" remote get-url upstream)" in
  git@github.com:NousResearch/hermes-agent.git|https://github.com/NousResearch/hermes-agent.git) ;;
  *) echo "upstream is not the official Hermes Agent repository" >&2; exit 1 ;;
esac

if ! git -C "$repo_root" show-ref --verify --quiet "refs/heads/$snapshot_branch"; then
  echo "Missing local $snapshot_branch branch" >&2
  exit 1
fi

git -C "$repo_root" fetch --depth=1 --filter=blob:none upstream main
source_commit=$(git -C "$repo_root" rev-parse FETCH_HEAD)
source_tree=$(git -C "$repo_root" rev-parse "$source_commit^{tree}")
snapshot_tree=$(git -C "$repo_root" rev-parse "$snapshot_branch^{tree}")

if [[ "$source_tree" != "$snapshot_tree" ]]; then
  temp_dir=$(mktemp -d)
  worktree="$temp_dir/worktree"
  cleanup() {
    git -C "$repo_root" worktree remove --force "$worktree" >/dev/null 2>&1 || true
    rmdir "$temp_dir" 2>/dev/null || true
  }
  trap cleanup EXIT

  git -C "$repo_root" worktree add --quiet "$worktree" "$snapshot_branch"
  git -C "$worktree" read-tree --reset -u "$source_commit"
  # The snapshot copies the official tree byte for byte; fork pre-commit tools
  # are not installed in this temporary checkout.
  git -C "$worktree" -c core.hooksPath=/dev/null commit --quiet \
    -m "Sync Hermes Agent snapshot ${source_commit:0:12}" \
    -m "Upstream-Commit: $source_commit"
  echo "Prepared official snapshot $source_commit"
else
  echo "Source tree already matches official commit $source_commit"
fi

echo "Review the differences between $snapshot_branch and main before merging."
if [[ "${1:-}" == "--push" ]]; then
  git -C "$repo_root" push origin "$snapshot_branch"
fi
