# ADR-002: Use contentless FTS5 for full-text search

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The Spec Library needs full-text search across spec titles, content, tags, themes, owners, and repositories. Search must return results within 200ms at a catalog of 5,000 specs (Requirement 16.2). The app runs as a single-process Crew app with SQLite — any search solution must work within that model.

## Decision Drivers

- Must operate within a single-process, SQLite-backed Crew app (no external services)
- 200ms response time requirement at 5,000 specs
- Need to search across multiple fields (title, content, owner, theme, tags, repository)
- Must support BM25 ranking for relevance ordering
- Storage overhead should be minimal since we already store full content in the `artifacts` table

## Considered Options

1. SQLite FTS5 with contentless tables (content synced via triggers)
2. In-process search library (Lunr.js, MiniSearch, or similar)
3. External search service (MeiliSearch, Typesense)

## Decision Outcome

**Chosen option:** Option 1 — Contentless FTS5, because it provides BM25 ranking natively, operates within SQLite's single-writer model, requires zero additional dependencies, and meets the performance target without external infrastructure.

### Positive Consequences

- Zero dependencies — FTS5 is built into SQLite
- BM25 ranking out of the box with `ORDER BY rank`
- Contentless mode (`content=''`) minimizes storage by not duplicating text
- Atomic with the main database — no sync lag between writes and search index
- Column-scoped MATCH queries allow targeted field searching

### Negative Consequences / Trade-offs

- Contentless FTS5 requires explicit INSERT/DELETE to keep in sync (no automatic content lookup)
- No fuzzy matching — FTS5 supports prefix queries (`term*`) but not Levenshtein distance
- `contentless_delete=1` requires FTS5 vocabulary to be rebuilt on delete (minor overhead)
- Limited to BM25 — no semantic/vector search without a separate system

## Options Analysis

### Option 1: Contentless FTS5
**Pros:** Zero-dep, BM25, atomic with writes, proven at 10K+ doc scale in SQLite, column-targeted queries
**Cons:** No fuzzy, manual sync via triggers, no semantic understanding

### Option 2: In-process JS search library
**Pros:** Fuzzy matching, customizable scoring, runs in-process
**Cons:** Must rebuild index on startup (slow for 5K docs), memory overhead for inverted index, no persistence across restarts, re-implementing BM25

### Option 3: External search service
**Pros:** Rich features (typo tolerance, facets, semantic), horizontal scaling
**Cons:** Adds deployment dependency, violates single-process Crew app model, network latency, sync lag between SQLite and search index

## Links and References

- Relates to: [ADR-001](./ADR-001-bun-workspace-monorepo.md) (SQLite choice)
- Implementation: `backend/src/db/migrations/002-fts5-indexes.ts`, `backend/src/db/queries/specs.ts`
- Requirements: 5.3, 16.2
- Branch: main
