# ADR-006: Schema migration 005 — correctness improvements

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context

Schema review identified 8 correctness issues accumulated across migrations 001–004: a missing `updated_at` column on `specs`, a missing `submitted_by` column on `proposals`, `snapshot_artifacts` lacking `ON DELETE CASCADE` on its `snapshot_id` foreign key, two missing query indexes, an inconsistently-named column on `audit_events`, and a denormalized snapshot field needed for display without a join.

## Decision

Fix all 8 issues in a single migration (005). These are objective correctness fixes — not design trade-offs — so no alternatives analysis is warranted.

## Rationale

Each issue is a clear defect (a missing column, an unindexed join, an un-cascaded foreign key, an inconsistent name). Batching them in one migration avoids churn from eight separate version bumps and allows a single atomic rollback point.

## Implementation

- **File:** `backend/src/db/migrations/005-schema-improvements.ts`
- Adds `specs.updated_at` (backfilled from `indexed_at`)
- Adds `proposals.submitted_by` (default `'mcp-agent'`)
- Recreates `snapshot_artifacts` (SQLite can't add a foreign key to an
  existing table) so its `snapshot_id` reference to `snapshots(id)` carries
  `ON DELETE CASCADE`
- Adds a composite index `idx_relationships_target_type` on
  `relationships(target_spec_key, type)`
- Adds `idx_rejections_data_hash` on `rejections(data_hash)`
- Renames `audit_events.spec_id` to `spec_key`, matching every other
  table's `spec_key` naming convention
- Adds `snapshots.spec_title_at_snapshot` (backfilled from `specs.title` at
  migration time), a denormalized title so archive listings don't need a
  join against `specs` for snapshots whose source spec may since have
  changed or been removed
- Explicitly does **not** add `json_valid()` CHECK constraints on the JSON
  columns identified in review — SQLite cannot add CHECK constraints to an
  existing table without a full recreate, and the application-layer Zod
  schemas already enforce JSON validity on write

## Links and References

- Relates to: [ADR-002](./ADR-002-fts5-fulltext-search.md) (schema foundation)
- Branch: HEAD
