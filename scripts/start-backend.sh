#!/usr/bin/env bash
# Start the Spec Library backend. Handles:
#   1. Build-if-stale check (rebuild if dist is older than sources)
#   2. Kill any stale process on the port
#   3. Exec into bun to run the backend
#
# The gateway passes PORT as an env var (auto-allocated from 9100-9200 range).
# Falls back to SPEC_LIBRARY_PORT or 3100 for standalone/dev use.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# Ensure bun is on PATH (gateway process may have minimal PATH)
export PATH="${HOME}/.bun/bin:${PATH}"

BUN="${HOME}/.bun/bin/bun"

# ─── Port selection ───────────────────────────────────────────────────────────
#
# The gateway spawns this script with PORT set to the port it auto-allocated
# (9100-9200) and proxies traffic there. A legitimate gateway spawn ALWAYS
# provides PORT. If we are running under the gateway (KIROCREW_BOUND_PORT is
# set) but PORT is absent, this is the buggy re-spawn path: the process would
# fall back to SPEC_LIBRARY_PORT/3100, bind a port the proxy never targets,
# fail the gateway's health check, get SIGTERM'd, and be re-spawned ~every
# minute — a flapping stray that races the correctly-supervised instance.
# Refuse to start in that case instead of squatting on the fallback port.
if [[ -z "${PORT:-}" && -n "${KIROCREW_BOUND_PORT:-}" ]]; then
  echo "[start-backend] Refusing to start: launched by the gateway (KIROCREW_BOUND_PORT=${KIROCREW_BOUND_PORT}) but no allocated PORT was provided." >&2
  echo "[start-backend] Binding the SPEC_LIBRARY_PORT fallback here would create a flapping stray on an un-proxied port. Exiting." >&2
  exit 0
fi

PORT="${PORT:-${SPEC_LIBRARY_PORT:-3100}}"
DIST="backend/dist/index.mjs"

# ─── Build if stale ───────────────────────────────────────────────────────────

needs_build() {
  [[ ! -f "$DIST" ]] && return 0
  # Check if any source is newer than the bundle
  local newest_src
  newest_src=$(find shared/src backend/src -name '*.ts' -newer "$DIST" 2>/dev/null | head -1)
  [[ -n "$newest_src" ]]
}

if needs_build; then
  echo "[start-backend] Building..."
  # Ensure deps are available for bundling
  if [[ ! -d "node_modules" ]]; then
    echo "[start-backend] Installing dependencies..."
    "$BUN" install
  fi
  "$BUN" build shared/src/index.ts --target=bun --outfile=shared/dist/index.mjs
  "$BUN" build backend/src/index.ts --target=bun --outfile=backend/dist/index.mjs
fi

# ─── Port cleanup ────────────────────────────────────────────────────────────

kill_port() {
  local pids
  pids=$(lsof -ti "tcp:$PORT" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "[start-backend] Killing stale process(es) on port $PORT: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
}

kill_port

# ─── Exec ─────────────────────────────────────────────────────────────────────

echo "[start-backend] Starting on port $PORT"
export SPEC_LIBRARY_PORT="$PORT"
exec "$BUN" run "$DIST"
