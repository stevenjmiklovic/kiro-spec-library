# ADR-001: Use Bun workspace monorepo with Elysia backend

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The Kiro Spec Library needs a runtime and project structure to support a full-stack Crew app: a React UI bundle (ESM library consumed by Crew's shell), a backend HTTP service with SQLite, and an MCP server process. The chosen tooling must support TypeScript natively, offer fast startup for the backend process, and integrate cleanly with Crew's app model (Bun runtime requirement in `app.json`).

## Decision Drivers

- Crew's app manifest requires `"runtime": "bun"` for backend and MCP processes
- Need native TypeScript execution without a separate compile step for development
- `bun:sqlite` provides zero-dependency SQLite with WAL mode — eliminates `better-sqlite3` native addon builds
- Monorepo with shared types between backend, UI, and MCP workspaces
- Type-safe HTTP routing with runtime validation to reduce boilerplate

## Considered Options

1. Bun workspaces + Elysia (type-safe HTTP framework built for Bun)
2. Bun workspaces + Hono (portable Workers-first framework)
3. Node.js + pnpm workspaces + Express + better-sqlite3

## Decision Outcome

**Chosen option:** Option 1 — Bun workspaces + Elysia, because it is the only option that satisfies the Crew runtime requirement natively while providing TypeBox schema validation integrated into the router (eliminating a separate validation layer) and `bun:sqlite` for zero-dependency database access.

### Positive Consequences

- Single runtime for all processes (backend, MCP, dev tooling)
- Native TypeScript — no tsc build step required for execution
- `bun:sqlite` is built-in: no native addon compilation, no platform-specific binaries
- Elysia's TypeBox integration validates request bodies at the router level
- Fast startup (~50ms cold start) suitable for Crew's process lifecycle

### Negative Consequences / Trade-offs

- Bun ecosystem is younger than Node.js — some packages may have compatibility issues
- Elysia is less widely adopted than Express/Fastify — smaller community for troubleshooting
- `bun:sqlite` API differs slightly from `better-sqlite3` — no ecosystem of SQLite plugins

## Options Analysis

### Option 1: Bun + Elysia
**Pros:** Native Crew runtime match, built-in SQLite, TypeBox validation in router, fastest startup, workspace support
**Cons:** Younger ecosystem, Elysia-specific patterns

### Option 2: Bun + Hono
**Pros:** Portable (runs on Workers, Deno, Node too), larger community than Elysia
**Cons:** No built-in TypeBox validation (needs separate middleware), designed for edge/serverless not long-running processes with SQLite

### Option 3: Node.js + pnpm + Express
**Pros:** Massive ecosystem, most documentation, battle-tested
**Cons:** Crew manifest requires Bun runtime — would need shim or dual-runtime. Requires better-sqlite3 native compilation. No native TS execution.

## Links and References

- Relates to: Crew App Manifest specification (`app.json`)
- Implementation: `package.json`, `backend/package.json`, `app.json`
- Branch: main
