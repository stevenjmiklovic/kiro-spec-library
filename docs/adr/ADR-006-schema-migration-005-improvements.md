# ADR-006: Schema migration 005 — correctness improvements

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context

Schema review identified 9 correctness issues accumulated across migrations 001–004: orphaned rows from deleted specs without cascading deletes, dangling foreign key references in the relationships table, missing indexes on frequently-queried columns, and inconsistent naming conventions in constraint identifiers.

## Decision

Fix all 9 issues in a single migration (005). These are objective correctness fixes — not design trade-offs — so no alternatives analysis is warranted.

## Rationale

Each issue is a clear defect (constraint violations, missing cascades, unindexed join columns, naming inconsistencies). Batching them in one migration avoids churn from nine separate version bumps and allows a single atomic rollback point.

## Implementation

- **File:** `backend/src/db/migrations/005-schema-improvements.ts`
- Adds `ON DELETE CASCADE` to relationship foreign keys
- Removes orphaned rows left by prior non-cascading deletes
- Adds indexes on `relationships(source_id)`, `relationships(target_id)`, `tags(artifact_id)`
- Renames constraints to follow `{table}_{column}_fk` / `{table}_{column}_idx` convention
- Adds `NOT NULL` constraints on columns that were nullable by omission but never null in practice

## Links and References

- Relates to: [ADR-002](./ADR-002-fts5-fulltext-search.md) (schema foundation)
- Branch: HEAD
