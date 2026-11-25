# ADR-0004: Interim visual direction

- **Status:** Accepted as **interim** — final brand identity pending D-10
- **Date:** 2026-11-25

## Context

No logo or brand palette exists. The brief asks for a calm, trustworthy, youth-friendly but
professional look, and forbids inventing a final identity without recording it.

## Decision

- **Wordmark:** text "RISE NETWORK" in the system font, bold, letter-spaced. No logo image.
- **Palette:** deep teal primary (`#0f5c5a`, ≥ 7:1 on white), warm amber accent used
  sparingly for highlights (`#b45309` for text, ≥ 4.5:1 on white), neutral slate greys.
  A dark theme mirrors the tokens.
- **Typography:** system font stack (no web-font download — saves data on mobile);
  base 16 px, modular scale 1.25.
- **Spacing:** 4 px base scale (`--space-1` … `--space-8`).
- **Components:** flat surfaces, 1 px borders, 8 px radius, no gradients, no decorative
  animation; `prefers-reduced-motion` respected.
- **Focus:** 3 px outline in the primary colour with offset, always visible on keyboard focus.

All values live in `src/styles/tokens.css` so the identity can be swapped without touching
components.

## Consequences

Replacing the palette later is a token change. Contrast must be re-verified on change.
