import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const launcherPath = join(root, "scripts", "start-backend.sh");

function executableLines(script: string): string[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

describe("start-backend launcher supervision contract", () => {
  /** Validates: Requirements 2.1 */
  test("ends by execing Bun directly without a trailing command", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));

    expect(lines.at(-1)).toBe('exec "$BUN" "$DIST"');
    expect(lines).not.toContain('bun run "$DIST"');
    expect(lines.join("\n")).not.toMatch(/\bbun\s+run\b/);
  });

  /** Validates: Requirements 2.1 */
  test("keeps the preamble foreground and free of watcher processes", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));
    const preamble = lines.slice(0, -1);

    expect(preamble).not.toContainEqual(expect.stringMatching(/(^|[^&])&\s*(?:#.*)?$/));
    expect(preamble.join("\n")).not.toMatch(/\bnohup\b/);
    expect(preamble.join("\n")).not.toMatch(
      /\b(?:bun\s+(?:run\s+)?--watch|(?:npm|pnpm|yarn)\s+run\s+\S*watch)\b/,
    );
  });
});
