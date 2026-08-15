# ADR-005: Supersession replaces Legal Hold for spec disposition

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The initial data model imported a "Legal Hold" concept from digital preservation systems (archival repositories, records management). In that domain, legal holds freeze records against deletion during litigation or compliance reviews. In the Kiro Spec Library context — an engineering specification catalog — this concept is inapplicable: specs are never under litigation hold, and the workflow concern is instead "has this spec been replaced by a newer one?"

## Decision Drivers

- Legal Hold has no real-world applicant in an engineering spec catalog
- The actual disposition question is: "Is this spec still current or has it been superseded?"
- The data model already has a `supersedes` relationship type between specs
- Disposition should be derived from existing graph relationships, not stored as a separate field
- Removal of dead code simplifies the schema and UI

## Considered Options

1. Keep Legal Hold as-is (preserve for potential future compliance use)
2. Replace with a generic Disposition field (active/deprecated/archived enum)
3. Supersession chain via existing `supersedes` relationship graph
4. Review cadence TTL (specs expire after N months without review)

## Decision Outcome

**Chosen option:** Option 3 — Supersession chain via the existing `supersedes` relationship, because it derives disposition from data that already exists in the graph, requires no new fields or manual status management, and accurately models how engineering specs evolve (a new version supersedes the old).

### Positive Consequences

- Zero new schema fields — disposition is computed from the relationship graph
- Impossible for disposition to drift out of sync (it's derived, not stored)
- Supersession chains are navigable: users can trace the evolution of a spec lineage
- All Legal Hold UI and backend code removed — less surface area to maintain
- Aligns with how engineers actually think about spec lifecycle

### Negative Consequences / Trade-offs

- No explicit "deprecated" state independent of supersession (a spec can only be outdated if something replaces it)
- Database columns related to Legal Hold are dormant (not dropped) pending a future migration cleanup
- Requires a graph traversal to determine current disposition (trivial at expected scale)
- If a spec is abandoned without a successor, there's no way to mark it deprecated without creating a successor

## Options Analysis

### Option 1: Keep Legal Hold
**Pros:** No code change, hypothetical future compliance use
**Cons:** Dead concept that confuses users, no real-world trigger for activation, clutters UI with an action nobody takes, imported from a different domain

### Option 2: Generic Disposition field
**Pros:** Explicit status, simple enum, manually controlled
**Cons:** Requires manual maintenance (someone must mark specs deprecated), drifts out of sync, adds a field that duplicates information already inferrable from relationships

### Option 3: Supersession chain
**Pros:** Derived from existing data, always in sync, models real spec evolution, navigable lineage, no new fields
**Cons:** No "deprecated without successor" state, requires graph query (trivial), dormant DB columns until cleanup migration

### Option 4: Review cadence TTL
**Pros:** Automatic expiration, forces periodic review, no manual status changes
**Cons:** Arbitrary time thresholds, valid long-lived specs would appear stale, creates false urgency, doesn't model the actual relationship between old and new specs

## Links and References

- Relates to: [ADR-003](./ADR-003-tfidf-suggestion-engine.md) (relationship graph)
- Implementation: UI derives disposition from graph traversal. Database columns for legalHold are dormant (not dropped). All `legalHold` code paths removed from backend and frontend.
- Branch: HEAD
