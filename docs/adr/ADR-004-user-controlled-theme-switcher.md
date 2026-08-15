# ADR-004: User-controlled theme switcher with URL persistence

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The Spec Library UI initially had two views with hardcoded themes: the Relationship graph view used a dark theme and the Archive list view used a light theme. User feedback indicated a preference for consistent theming across all views with manual control, rather than implicit per-view switching that breaks visual continuity.

## Decision Drivers

- User explicitly directed that theme be a global toggle, not per-view
- Theme preference should survive page reloads and be shareable via URL
- Both views must render correctly in both themes (no hardcoded color assumptions)
- Minimal implementation overhead — no server-side session or database storage needed

## Considered Options

1. Hardcoded per-view themes (dark=Relationship, light=Archive)
2. User toggle with URL persistence via `?mode=light|dark` query parameter
3. Automatic OS `prefers-color-scheme` detection

## Decision Outcome

**Chosen option:** Option 2 — User toggle with URL persistence, because it gives the user explicit control, persists across reloads via the URL, and allows sharing a themed link with colleagues without requiring server-side state.

### Positive Consequences

- User has direct control over their visual environment
- Theme persists across page reloads and is bookmarkable
- Shareable URLs carry theme context (useful for screenshots, documentation links)
- Both views work in both themes — forces complete CSS coverage
- No server-side state or authentication dependency

### Negative Consequences / Trade-offs

- URL carries an extra query parameter (minor visual noise)
- No automatic adaptation to user's OS dark/light preference
- Users who prefer OS-driven theming must manually toggle
- All components must support both themes (more CSS surface area to maintain)

## Options Analysis

### Option 1: Hardcoded per-view themes
**Pros:** Zero implementation cost, each view optimized for its specific visual context
**Cons:** Jarring transitions between views, user has no control, violates user's explicit directive, forces dark-only or light-only assumptions into component CSS

### Option 2: User toggle + URL persistence
**Pros:** User-directed, survives reloads, shareable, decoupled from OS settings, forces comprehensive theme support
**Cons:** Extra query param, no automatic OS adaptation

### Option 3: OS prefers-color-scheme
**Pros:** Zero user interaction, follows system convention, familiar UX pattern
**Cons:** No manual override, not shareable (recipient sees their own OS theme), user explicitly rejected implicit behavior in favor of a toggle

## Links and References

- Relates to: [ADR-001](./ADR-001-bun-workspace-monorepo.md) (app architecture)
- Implementation: `frontend/src/hooks/useUrlState.ts` (themeMode), `frontend/src/components/AppChrome.tsx` (toggle), cross-theme CSS variables
- Branch: HEAD
