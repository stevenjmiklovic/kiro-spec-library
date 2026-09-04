import { existsSync } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { SourceConfigSchema } from "@kiro-spec-library/shared";
import { Elysia, t } from "elysia";
import { listSources, replaceSources } from "../db/queries/sources.js";
/** True iff `abs` is the home dir or strictly inside it (cross-platform). */
function isWithinHome(abs, home) {
    if (abs === home)
        return true;
    const rel = relative(home, abs);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
/** Directory names that are never listed or navigable, regardless of location. */
const BLOCKED_DIR_NAMES = new Set([
    ".ssh",
    ".aws",
    ".gnupg",
    ".gpg",
    ".config",
    ".kube",
    ".docker",
    ".credentials",
    ".secrets",
    "node_modules",
    ".git",
]);
export function settingsRoutes(deps) {
    const { db } = deps;
    return (new Elysia({ prefix: "/settings" })
        .get("/sources", () => {
        const sources = listSources(db);
        return { sources };
    })
        // ── Directory browser ──────────────────────────────────────────────────
        // Lists immediate subdirectories of `path` so the UI can offer a
        // folder-picker instead of a free-text field. Browsing is confined to the
        // user's home directory, and credential/system directories are never
        // listed. Read-only: it never opens files, only enumerates directory names.
        .get("/browse", async ({ query, set }) => {
        // Browsing is confined to the user's home directory. SPEC_LIBRARY_BROWSE_ROOT
        // overrides the base for tests only (os.homedir() ignores a runtime
        // process.env.HOME mutation on macOS, so tests need an explicit seam);
        // production leaves it unset and confines to the real home.
        const home = process.env.SPEC_LIBRARY_BROWSE_ROOT || homedir();
        const requested = query.path?.trim() || home;
        // Resolve the requested path to an absolute path.
        let abs;
        try {
            abs = resolve(requested);
        }
        catch {
            set.status = 400;
            return { code: "BAD_REQUEST", message: "Invalid path" };
        }
        // Resolve symlinks to the REAL target FIRST, then run every check
        // (confinement, blocked-segment, directory) against that single
        // resolved path. Checking the real path and then operating on the same
        // real path closes the check-vs-use gap that a pre-resolution check
        // would leave open (CWE-367). realHome is likewise canonicalized so the
        // comparison is real-path vs real-path.
        let realAbs;
        let realHome;
        try {
            realHome = await realpath(home);
        }
        catch {
            set.status = 500;
            return { code: "INTERNAL", message: "Cannot resolve home directory." };
        }
        try {
            realAbs = await realpath(abs);
        }
        catch {
            set.status = 404;
            return { code: "NOT_FOUND", message: "Directory not found." };
        }
        // Confine to home (cross-platform: relative() + isAbsolute(), never a
        // re-normalization that can collapse a traversal back inside home).
        if (!isWithinHome(realAbs, realHome)) {
            set.status = 403;
            return {
                code: "FORBIDDEN",
                message: "Browsing is confined to your home directory.",
            };
        }
        // Reject if any segment of the real path is a blocked directory name.
        const relSegs = relative(realHome, realAbs).split(/[/\\]/).filter(Boolean);
        if (relSegs.some((s) => BLOCKED_DIR_NAMES.has(s.toLowerCase()))) {
            set.status = 403;
            return { code: "FORBIDDEN", message: "That directory is not browsable." };
        }
        // Must be a directory (stat on the already-resolved real path).
        try {
            const st = await stat(realAbs);
            if (!st.isDirectory()) {
                set.status = 400;
                return { code: "BAD_REQUEST", message: "Not a directory." };
            }
        }
        catch {
            set.status = 404;
            return { code: "NOT_FOUND", message: "Directory not found." };
        }
        // Enumerate immediate subdirectories.
        let entries;
        try {
            entries = await readdir(realAbs, { withFileTypes: true });
        }
        catch {
            set.status = 403;
            return { code: "FORBIDDEN", message: "Cannot read that directory." };
        }
        // Resolve each candidate child to its real target and KEEP ONLY those
        // that (a) are directories, (b) are not a blocked name, and (c) whose
        // real target stays inside home. Resolving the target before listing is
        // what stops a symlink from surfacing a path outside home (CWE-59); a
        // symlink to a directory outside home is silently dropped, not shown.
        const dirs = [];
        for (const e of entries) {
            const name = e.name;
            if (BLOCKED_DIR_NAMES.has(name.toLowerCase()))
                continue;
            if (!e.isDirectory() && !e.isSymbolicLink())
                continue;
            const childAbs = join(realAbs, name);
            let childReal;
            try {
                childReal = await realpath(childAbs);
            }
            catch {
                continue; // dangling symlink or unreadable — skip
            }
            if (!isWithinHome(childReal, realHome))
                continue; // symlink escapes home
            try {
                if (!(await stat(childReal)).isDirectory())
                    continue; // symlink to a file
            }
            catch {
                continue;
            }
            let hasSpecs = false;
            try {
                hasSpecs = existsSync(join(childReal, ".kiro", "specs"));
            }
            catch {
                hasSpecs = false;
            }
            dirs.push({ name, path: childReal, hasSpecs });
        }
        dirs.sort((a, b) => a.name.localeCompare(b.name));
        // Parent, only when it stays within home.
        const parentAbs = realAbs === realHome ? null : resolve(realAbs, "..");
        const parent = parentAbs !== null && isWithinHome(parentAbs, realHome) ? parentAbs : null;
        return {
            path: realAbs,
            name: basename(realAbs) || realAbs,
            parent: parent,
            home: realHome,
            hasSpecs: existsSync(join(realAbs, ".kiro", "specs")),
            directories: dirs,
        };
    }, {
        query: t.Object({ path: t.Optional(t.String()) }),
    })
        .put("/sources", ({ body, set }) => {
        const validated = [];
        for (const raw of body) {
            const result = SourceConfigSchema.safeParse(raw);
            if (!result.success) {
                set.status = 422;
                return {
                    code: "VALIDATION_ERROR",
                    message: `Invalid source config for id "${raw.id}": ${result.error.message}`,
                };
            }
            validated.push({
                id: raw.id,
                type: result.data.type,
                path: result.data.type === "local" ? result.data.path : undefined,
                url: result.data.type === "remote" ? result.data.url : undefined,
                branch: result.data.type === "remote" ? result.data.branch : undefined,
                webUrlTemplate: result.data.type === "remote" ? result.data.webUrlTemplate : undefined,
                addedAt: raw.addedAt ?? new Date().toISOString(),
            });
        }
        // PUT replaces the entire source set (the UI's "Save & rescan"
        // promises this). Do it atomically so a removed source can't linger.
        replaceSources(db, validated);
        const sources = listSources(db);
        return { sources };
    }, {
        body: t.Array(t.Object({
            id: t.String(),
            type: t.Union([t.Literal("local"), t.Literal("remote")]),
            path: t.Optional(t.String()),
            url: t.Optional(t.String()),
            branch: t.Optional(t.String()),
            webUrlTemplate: t.Optional(t.String()),
            addedAt: t.Optional(t.String()),
        })),
    }));
}
