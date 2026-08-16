# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Kiro Spec Library project.

ADRs document significant architectural choices, their context, and their consequences. They are immutable once accepted — if a decision changes, a new ADR supersedes the old one.

## Format

We use a modified [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records) format. Each ADR is numbered sequentially and named `ADR-{NNN}-{kebab-case-title}.md`.

## Status Lifecycle

```
Draft → Proposed → Accepted → Deprecated
                           → Superseded by ADR-NNN
```

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-bun-workspace-monorepo.md) | Use Bun workspace monorepo with Elysia backend | Accepted | 2026-08-14 |
| [ADR-002](./ADR-002-fts5-fulltext-search.md) | Use contentless FTS5 for full-text search | Accepted | 2026-08-14 |
| [ADR-003](./ADR-003-tfidf-suggestion-engine.md) | Use in-process TF-IDF for relationship suggestions | Accepted | 2026-08-14 |
| [ADR-004](./ADR-004-user-controlled-theme-switcher.md) | User-controlled theme switcher with URL persistence | Accepted | 2026-08-14 |
| [ADR-005](./ADR-005-supersession-replaces-legal-hold.md) | Supersession replaces Legal Hold for spec disposition | Accepted | 2026-08-14 |
| [ADR-006](./ADR-006-schema-migration-005-improvements.md) | Schema migration 005 — correctness improvements | Accepted | 2026-08-14 |
| [ADR-007](./ADR-007-mcp-token-authentication.md) | MCP token authentication with opt-in enforcement | Accepted | 2026-08-16 |
| [ADR-008](./ADR-008-gateway-sdk-routing-adapter.md) | Gateway SDK routing adapter with direct fetch | Accepted | 2026-08-16 |

## Creating a New ADR

Use `/adr "decision title"` in KiroCrew chat, or create manually following the template in existing ADRs.
