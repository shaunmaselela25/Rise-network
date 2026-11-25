# Contributing to RISE NETWORK

## Branching

- Never commit directly to `main`.
- Branch names: `feature/…`, `fix/…`, `docs/…`, `chore/…`, `security/…`.
- No force-pushes to shared branches.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
`chore:`, `test:`, `ci:`, `security:`, `refactor:`. Keep commits small and reviewable.

## Pull requests

- Fill in the PR template, including **actual** test evidence.
- CI must be green. At least one review before merge; merges to `main` need product-owner
  approval.
- Update documentation in the same PR as the code it describes.

## Code conventions

- TypeScript strict; no `any` without a comment explaining why.
- Organise code by feature under `src/features/`; shared UI in `src/components/`.
- Styling with CSS Modules and tokens from `src/styles/tokens.css`; no hard-coded colours.
- Every interactive element must be keyboard accessible and labelled.
- No visible control that does nothing — unbuilt features must say so.
- No new runtime dependency without updating ADR-0003.
- Authorisation belongs in the database (RLS / functions), never only in the UI.

## Testing

- Add or update tests with every behaviour change.
- Query by role and accessible name in component tests.
- Never mark tests as skipped without a recorded reason.

## Code review checklist

Correctness · security and access control · privacy (new personal data?) · accessibility ·
tests · documentation · no secrets.
