# Private Hermes Desktop workflow

This repository is a private, independent copy of Nous Research's MIT-licensed
Hermes Agent. The initial source tree exactly matches upstream commit
`fcc26fbd9f1641755e49793d7ed608f3b7214c3d`. It is not a GitHub fork and
cannot use GitHub's **Sync fork** button.

## Branches

- `main`: our reviewed Desktop changes and the integrated official updates.
- `upstream-snapshot`: an unmodified snapshot of the official source tree.
  Only `scripts/sync-private-upstream.sh` should advance this branch.
- Short-lived `desktop/*` branches: one focused change at a time, merged into
  `main` through a pull request.

`origin` is this private repository. `upstream` fetches
`NousResearch/hermes-agent`; pushing to it is disabled locally. Keep the
upstream `LICENSE` and copyright notices when distributing a build.

## Developing Desktop

Prefer changes in `apps/desktop/src` for the interface and
`apps/desktop/electron` for native behavior. Change `apps/shared` only when its
transport or shared types need to change. Keep agent and gateway behavior on
the official implementation unless the feature requires a backend change.

Read the root and Desktop `AGENTS.md` files before editing. Install JavaScript
dependencies from the repository root with `npm install`. Run Desktop against
an isolated development home, following `apps/desktop/README.md`:

```bash
cd apps/desktop
../../scripts/dev-sandbox.sh npm run dev
```

The sandbox command keeps development settings and user data away from a live
Hermes installation. Before installing a custom build, give it a distinct app
identity and update feed; see `apps/desktop/product-identity.cjs` and
`apps/desktop/BUILDING.md`.

## Bringing in an official update

1. Run `bash scripts/sync-private-upstream.sh` from this repository. It fetches
   the latest official `main`, records its exact tree on `upstream-snapshot`,
   and pushes that branch to the private repository. It never changes our
   `main` working tree.
2. Compare `upstream-snapshot` with `main` and open a pull request into `main`.
   Review changes in Desktop, `apps/shared`, the gateway protocol, packaging,
   and dependencies. Resolve any conflicts deliberately.
3. Run the checks relevant to the changed code. For a Desktop update, start
   with `npm --workspace apps/desktop run typecheck`,
   `npm --workspace apps/desktop run test:ui`,
   `npm --workspace apps/desktop run test:desktop:platforms`, and
   `npm --workspace apps/desktop run build`. Run the install and update checks
   in `apps/desktop/BUILDING.md` if packaging or runtime ownership changed.
4. **Merge the upstream pull request with a merge commit.** Do not squash or
   rebase this branch: retaining its ancestry makes the next upstream update
   show only new changes. Then test the resulting Desktop with isolated user
   data before packaging a release.

The snapshot branch intentionally records source trees rather than importing
the official repository's large Git history. Every sync commit includes the
official SHA in its message. This keeps the private repository small while
Git can still merge future source changes against the previous snapshot.
