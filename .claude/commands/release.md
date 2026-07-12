---
description: Cut a new release — update CHANGELOG, bump version, tag, push, and let CI publish the GitHub release that users auto-update from.
argument-hint: '[X.Y.Z | major | minor | patch]'
---

Cut a release of Flash For Wards. Version argument: `$ARGUMENTS` (may be empty).

Everything after the tag push is automated: `.github/workflows/release.yml` builds win/mac/linux
installers, uploads them plus the `latest*.yml` update manifests to a draft GitHub release, then
flips that release live with the new CHANGELOG section as its body. Running apps poll GitHub via
`electron-updater`, download in the background, and show a "Restart now" banner.

## 1. Preflight

Abort with a clear explanation if any check fails — do not try to fix these yourself.

```bash
git rev-parse --abbrev-ref HEAD   # must be main
git status --porcelain            # must be empty
git fetch origin && git status -sb  # must not be behind origin/main
gh auth status                    # must be logged in
```

## 2. Pick the version

- If `$ARGUMENTS` is a semver (`1.2.0`) or `major|minor|patch`, use it. Resolve the keyword against
  the current `package.json` version.
- If empty: read the `## [Unreleased]` section of `CHANGELOG.md` and `git log $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)..HEAD --oneline`, propose a semver bump with a one-line rationale, and **ask the user to confirm before writing anything**.
- Refuse if the resolved tag `vX.Y.Z` already exists (`git tag -l vX.Y.Z`).
- Refuse if `## [Unreleased]` has no entries — there is nothing to release.

## 3. CHANGELOG.md

- Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` (today's date).
- Insert a fresh empty `## [Unreleased]` heading above it.
- Rewrite the link refs at the bottom:
  - `[Unreleased]: https://github.com/JCombee/flash-for-wards-app/compare/vX.Y.Z...HEAD`
  - add `[X.Y.Z]: https://github.com/JCombee/flash-for-wards-app/compare/v<prev>...vX.Y.Z`
    (for the very first tagged release, use `.../releases/tag/vX.Y.Z` instead).

The workflow extracts release notes by matching the `## [X.Y.Z]` heading, so the version in the
heading must match the tag exactly, minus the `v`.

## 4. Bump, format, commit, tag, push

```bash
npm version X.Y.Z --no-git-tag-version   # bumps package.json AND package-lock.json
npx prettier --write package.json package-lock.json CHANGELOG.md
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --follow-tags
```

The lockfile must be bumped in lockstep — CI runs `npm ci`, which fails on a drifted lock. CI also
runs `prettier --check .`, hence the format step.

## 5. Report

Print the workflow run URL (`gh run list --workflow=release.yml --limit 1`) and tell the user the
release goes live automatically once all three platform builds finish (~10 min). Offer `gh run watch`.

## If something fails after the commit

Do not force-push. Tell the user how to undo locally:

```bash
git tag -d vX.Y.Z
git reset --hard HEAD~1
```

If the tag was already pushed and the build failed, the fix is a new patch release, not a retagged
one — a moved tag breaks `electron-updater` clients that already saw the old manifest.
