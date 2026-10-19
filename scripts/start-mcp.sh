#!/usr/bin/env bash
# Start the Spec Library MCP server. Handles:
#   1. Anchoring to the app root so relative module paths resolve
#   2. Ensuring workspace dependencies exist before launching (self-heal)
#   3. Exec into bun so the recorded PID is the real MCP process
#
# WHY THIS SCRIPT EXISTS: the MCP server is spawned by the Crew gateway with an
# unknown cwd and a possibly-pruned node_modules (a library install may ship
# without it). A bare `bun run mcp/src/index.ts` fails on both counts — the
# relative path doesn't resolve, and the `@kiro-spec-library/shared` workspace
# import is missing — which is exactly what quarantined this server before.

set -euo pipefail

# Supervision contract: every command before the final exec is foreground and
# synchronous. Do not add a watcher, background job, subshell, or launcher
# wrapper here: once exec replaces this shell, such a child could outlive the
# PID the gateway records and signals.

# Anchor to the app root so `mcp/src/index.ts` and the workspace layout resolve
# regardless of the gateway's cwd.
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# Ensure bun is on PATH (gateway process may have a minimal PATH).
export PATH="${HOME}/.bun/bin:${PATH}"
BUN="${HOME}/.bun/bin/bun"

# ─── stdio contract (CRITICAL) ────────────────────────────────────────────────
#
# This process speaks MCP over stdio as JSON-RPC: stdout carries ONLY protocol
# frames. Any stray byte on stdout corrupts the stream and fails the gateway's
# discovery probe. Therefore every diagnostic in this script MUST go to stderr
# (>&2), and `bun install` output below is likewise redirected to stderr. Never
# add a bare stdout write anywhere in this script.

# ─── Self-heal: ensure deps exist before launch ──────────────────────────────
#
# This is the fix that prevents re-quarantine. If node_modules is missing, or
# the workspace link `@kiro-spec-library/shared` that mcp/src/index.ts imports
# is absent (e.g. a prune removed it), install before launching. The top-level
# `! -d node_modules` test is the primary guard; the `@kiro-spec-library/shared`
# sub-check is belt-and-suspenders in case a prune removed only the workspace
# link, and is harmless if it occasionally triggers a redundant `bun install`.
if [[ ! -d "node_modules" || ! -d "node_modules/@kiro-spec-library/shared" ]]; then
  echo "[start-mcp] Installing dependencies (node_modules or workspace link missing)..." >&2
  "$BUN" install >&2
fi

# ─── Exec ─────────────────────────────────────────────────────────────────────
#
# `exec "$BUN" mcp/src/index.ts` — NOT `bun run mcp/src/index.ts`. `bun run` is a
# launcher that starts a supervisor process and forks the script as a CHILD; the
# gateway would record the launcher PID, so on SIGTERM the forked child could be
# orphaned and re-parented to init/launchd, surviving gateway restarts and never
# getting reaped. Exec-ing bun directly makes the recorded PID the actual MCP
# runtime and stdio peer — one process, nothing to orphan, always reapable. The
# exec'd Bun process retains this launcher's process group, so a group-directed
# gateway signal has no preamble descendant to miss.
#
# This MUST remain the final action in this script: no command may follow it.
echo "[start-mcp] Starting MCP server on stdio" >&2
exec "$BUN" mcp/src/index.ts
