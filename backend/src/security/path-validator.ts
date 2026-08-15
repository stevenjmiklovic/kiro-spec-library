// Path validation — reject traversal, symlink escapes, oversized files, credential paths

import { realpath, stat } from "node:fs/promises";
import { resolve, relative, normalize } from "node:path";
import { CREDENTIAL_PATHS, MAX_ARTIFACT_BYTES } from "@kiro-spec-library/shared";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const ok: ValidationResult = { valid: true };
const reject = (reason: string): ValidationResult => ({ valid: false, reason });

/**
 * Validate a file path relative to a source root.
 * Rejects traversal, symlink escapes, credential paths, oversized files, and root paths.
 */
export async function validatePath(
  filePath: string,
  sourceRoot: string,
): Promise<ValidationResult> {
  // Reject filesystem root
  const normalized = normalize(filePath);
  if (normalized === "/" || normalized === "\\") {
    return reject("Filesystem root is not allowed as a path");
  }

  // Reject traversal: check raw input for .. segments (before normalization eats them)
  if (filePath.split(/[/\\]/).includes("..")) {
    return reject(`Path contains traversal component: ${filePath}`);
  }

  // Resolve to absolute
  const absolute = resolve(sourceRoot, normalized);

  // Ensure resolved path is within source root
  const resolvedRoot = resolve(sourceRoot);
  const rel = relative(resolvedRoot, absolute);
  if (rel.startsWith("..") || resolve(resolvedRoot, rel) !== absolute) {
    return reject(`Path resolves outside source root: ${absolute}`);
  }

  // Check against credential paths
  const lowerRel = rel.toLowerCase();
  for (const credPath of CREDENTIAL_PATHS) {
    if (lowerRel === credPath || lowerRel.startsWith(credPath + "/")) {
      return reject(`Access to credential path is forbidden: ${credPath}`);
    }
  }

  // Resolve symlinks and check they don't escape
  try {
    const realFile = await realpath(absolute);
    const realRoot = await realpath(resolvedRoot);
    const relFromReal = relative(realRoot, realFile);
    if (relFromReal.startsWith("..")) {
      return reject(`Symlink escapes source root: ${absolute} -> ${realFile}`);
    }
  } catch (err: unknown) {
    // File doesn't exist yet or can't be resolved — that's fine for validation
    // (caller may be checking before reading)
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      return reject(`Cannot resolve path: ${(err as Error).message}`);
    }
  }

  // Check file size
  try {
    const stats = await stat(absolute);
    if (stats.isFile() && stats.size > MAX_ARTIFACT_BYTES) {
      return reject(
        `File exceeds maximum size (${stats.size} > ${MAX_ARTIFACT_BYTES} bytes): ${normalized}`,
      );
    }
  } catch {
    // File doesn't exist — size check doesn't apply
  }

  return ok;
}

/**
 * Synchronous path check (no symlink resolution or size check).
 * Use for quick pre-filtering before async validation.
 */
export function validatePathSync(filePath: string, sourceRoot: string): ValidationResult {
  const normalized = normalize(filePath);

  if (normalized === "/" || normalized === "\\") {
    return reject("Filesystem root is not allowed as a path");
  }

  if (filePath.split(/[/\\]/).includes("..")) {
    return reject(`Path contains traversal component: ${filePath}`);
  }

  const absolute = resolve(sourceRoot, normalized);
  const resolvedRoot = resolve(sourceRoot);
  const rel = relative(resolvedRoot, absolute);

  if (rel.startsWith("..")) {
    return reject(`Path resolves outside source root: ${absolute}`);
  }

  const lowerRel = rel.toLowerCase();
  for (const credPath of CREDENTIAL_PATHS) {
    if (lowerRel === credPath || lowerRel.startsWith(credPath + "/")) {
      return reject(`Access to credential path is forbidden: ${credPath}`);
    }
  }

  return ok;
}
