# Hermes Desktop fork workflow

This repository is an independent copy of Nous Research's MIT-licensed
Hermes Agent. The initial source tree exactly matches upstream commit
`fcc26fbd9f1641755e49793d7ed608f3b7214c3d`. It is not a GitHub fork and
cannot use GitHub's **Sync fork** button.

## Branches

- `main`: our reviewed Desktop changes and the integrated official updates.
- `upstream-snapshot`: an unmodified snapshot of the official source tree.
  Only `scripts/sync-private-upstream.sh` should advance this branch.
- Short-lived `desktop/*` branches: one focused change at a time, merged into
  `main` through a pull request.

`origin` is the Kervia repository. `upstream` fetches
`NousResearch/hermes-agent`; pushing to it is disabled locally. Keep the
upstream `LICENSE` and copyright notices when distributing a build.

## Developing Desktop

Prefer changes in `apps/desktop/src` for the interface and
`apps/desktop/electron` for native behavior. Change `apps/shared` only when its
transport or shared types need to change. Keep agent and gateway behavior on
the official implementation unless the feature requires a backend change.

Read the root and Desktop `AGENTS.md` files before editing. Install JavaScript
dependencies from the repository root with `npm install`. On the current Mac,
launch the test Desktop from the repository root with:

```bash
bash scripts/run-private-desktop-dev.sh
```

This uses a persistent, ignored `.hermes-sandbox/` with its own `HERMES_HOME`,
Electron `userData`, app name, and single-instance lock. It pins the backend
source to this checkout and clears inherited remote and packaged-build
overrides. It also leaves the installed app as the handler for `hermes://`
links. The launcher builds the renderer and runs it from local files: the
remote gateway can refuse WebSockets from Vite's `127.0.0.1` development
origin even when its HTTP connection test succeeds. It does not copy the
installed Desktop's configuration; do not use
the sandbox's `--from` option for this workflow. The installed Hermes Desktop
and its local installation remain separate and can stay open.

The test Desktop can be given its own connection to the existing remote
gateway through its Connections UI. Enter the connection there rather than
copying the installed app's credential files. The current installed connection
is URL based; closing a URL connection does not run the SSH-managed remote
backend teardown. Local separation does not make remote actions harmless:
test connectivity with read-only checks first, and do not run update, reset,
configuration, or destructive agent actions against the live remote service.
This private Desktop does not run the automatic legacy-session owner migration
against remote gateways when it lists conversations.

For development against a local Hermes, run:

```bash
bash scripts/run-private-desktop-local.sh
```

This provisions the checkout's Python runtime inside an ignored
`.hermes-local-sandbox/` and starts a second Desktop identity with separate
settings and gateway data. It does not use the remote test profile or copy the
installed Hermes configuration. The first run may take several minutes.

Before installing a custom build outside the development launcher, give it a
distinct app identity and update feed; see `apps/desktop/product-identity.cjs`
and `apps/desktop/BUILDING.md`.

## Bringing in an official update

1. Run `bash scripts/sync-private-upstream.sh` from this repository. It fetches
   the latest official `main` and records its exact tree on the local
   `upstream-snapshot` branch. It never changes our `main` working tree or
   pushes anything unless `--push` is explicitly passed.
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
official SHA in its message. This keeps the repository small while
Git can still merge future source changes against the previous snapshot.
