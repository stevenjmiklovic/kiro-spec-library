# Tasks — Node backend migration

Build order is dependency-ordered. Each task maps back to requirement IDs.

- [ ] 1. **Driver spike: `better-sqlite3` + FTS5 under Node.** Add `better-sqlite3`,
  open a copy of an existing `spec-library.db`, run a representative FTS5 `MATCH`/`bm25`
  query, and assert identical results to the Bun build. Confirm the prebuilt binary
  has FTS5 (`sqlite_compileoption_used('ENABLE_FTS5')`). If FTS5 is absent, resolve
  (prebuilt variant / source build) before proceeding.
  _Requirements: 3.1, 3.2_

- [ ] 2. **Framework spike: Elysia Node adapter vs Hono.** Stand up `router.ts` under
  `@elysiajs/node` behind the gateway proxy; verify `GET /api/health` and one HMAC-signed
  proxied route. If unreliable, port the HTTP layer to Hono. Decide and record in `design.md`.
  _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. **Isolate the DB driver in `db/connection.ts`.** Swap `bun:sqlite` →
  `better-sqlite3`, keeping `prepare().run/get/all` call sites unchanged across the 9
  query modules. Add the FTS5 fail-closed startup assertion.
  _Requirements: 3.1, 3.2, 3.4_

- [ ] 4. **Port the HTTP/router layer** per the Task 2 decision, keeping all 41
  endpoints and their request/response shapes and the `X-KiroCrew-Proxy` verification.
  _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. **Node build pipeline.** Add an esbuild script
  (`--platform=node --format=esm --bundle --external:better-sqlite3 --outfile=backend/dist/index.mjs`),
  plus the shared bundle. Remove the `bun build --target=bun` path for the backend.
  _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. **Manifest cutover.** Set `app.json.backend` to
  `{type:"node", entryPoint:"backend/dist/index.mjs", healthCheck:"/api/health", port:"auto"}`;
  delete `scripts/start-backend.sh`. Add `package.json` with the `better-sqlite3`
  dependency so the gateway's `npm install --production` provisions it.
  _Requirements: 1.1, 1.4, 4.2_

- [ ] 7. **MCP server on Node.** Migrate `mcp/src` off `bun:sqlite`/bare-`bun` to the
  Node driver and a `node` command, keeping the four tools and their I/O identical.
  Remove the now-unneeded `mcp.extra_path_dirs` bun entry note.
  _Requirements: 6.1, 6.2_

- [ ] 8. **Adapt the test suite to Node.** Run unit/property/integration under
  `node --test` (or vitest) + `better-sqlite3`; fix any `bun:sqlite`/Bun-runner
  couplings without weakening assertions. Keep `tsc --build` clean.
  _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. **Anti-orphan regression test.** Spawn the backend via the gateway path (or a
  faithful equivalent), SIGTERM the recorded PID, assert zero residual listeners on the
  port and no orphaned child.
  _Requirements: 1.2, 1.3_

- [ ] 10. **Migration/data-safety test.** Open a pre-existing populated `spec-library.db`
  under the Node driver; assert no data loss and only pending migrations apply.
  _Requirements: 3.3, 3.4_

- [ ] 11. **CI on Node + wire Playwright E2E.** Update `ci.yml` to build/test on the
  Node runtime and add the Playwright E2E job (currently unrun). Verify green on the runner.
  _Requirements: 5.1, 5.2_

- [ ] 12. **End-to-end verification + install.** Full local suite green (688 + 11 E2E),
  install to the dev instance, confirm gateway launches `node backend/dist/index.mjs`,
  health 200, single-PID shape, and no orphan across a gateway restart.
  _Requirements: 1.1, 1.2, 1.3, 2.2_

- [ ] 13. **ADRs + changelog.** Record ADR-N1..N5 in `docs/adr/`, add changelog
  fragments, bump the minor version.
  _Requirements: (cross-cutting)_
