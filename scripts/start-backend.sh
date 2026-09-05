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
# provides PORT. Any launch WITHOUT PORT that still binds the hardcoded 3100
# fallback creates a backend the gateway never allocated, never proxies to, and
# never supervises or reaps — a second instance that survives gateway restarts
# and races the correctly-supervised one. This has bitten us twice: a gateway
# re-spawn with KIROCREW_BOUND_PORT set but no PORT (flapping ~every minute),
# and an orphaned hand-launch re-parented to launchd that lingered across
# restarts. Both share one root cause: a silent fallback to a fixed port.
#
# So: PORT is REQUIRED. The only way to bind the fallback is an EXPLICIT
# opt-in (SPEC_LIBRARY_STANDALONE=1), which a human sets for local dev and the
# gateway never sets. Absent both, refuse — never squat a port nothing proxies.
if [[ -z "${PORT:-}" ]]; then
  if [[ "${SPEC_LIBRARY_STANDALONE:-}" == "1" ]]; then
    PORT="${SPEC_LIBRARY_PORT:-3100}"
    echo "[start-backend] Standalone dev mode: binding fallback port ${PORT} (SPEC_LIBRARY_STANDALONE=1)." >&2
  else
    echo "[start-backend] Refusing to start: no PORT was provided." >&2
    echo "[start-backend]   - Under the gateway (KIROCREW_BOUND_PORT=${KIROCREW_BOUND_PORT:-<unset>}), PORT is always allocated; its absence means a buggy re-spawn." >&2
    echo "[start-backend]   - For a standalone dev run, set SPEC_LIBRARY_STANDALONE=1 (optionally with SPEC_LIBRARY_PORT)." >&2
    echo "[start-backend] Binding a hardcoded fallback here would create an un-proxied, un-supervised second instance. Exiting." >&2
    exit 1
  fi
fi

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
