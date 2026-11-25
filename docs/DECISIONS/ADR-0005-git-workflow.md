# ADR-0005: Git workflow

- **Status:** Accepted
- **Date:** 2026-11-25

## Decision

- `main` is protected in practice: no direct commits; changes arrive by reviewed pull request.
- Work happens on `feature/*`, `fix/*`, `docs/*`, `chore/*` branches.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `security:`).
- No force-push to shared branches; no history rewrites after push.
- CI must pass before merge. Merges to `main` and production deploys require product-owner
  approval.

## Note on the initial state

The repository had no commits, so `main` had no base commit. The foundation branch
`feature/rise-network-foundation` therefore starts from a root commit. To open the first
pull request, `main` needs a base: the recommended approach (pending PO approval) is to push
a single empty initial commit to `main`, rebase nothing, and open the PR from the feature
branch onto it.
