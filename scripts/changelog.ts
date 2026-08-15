#!/usr/bin/env bun
/**
 * Compile changelog fragments from changes/ into CHANGELOG.md
 *
 * Usage:
 *   bun run scripts/changelog.ts draft     # Preview without writing
 *   bun run scripts/changelog.ts compile   # Write to CHANGELOG.md and clear fragments
 */

import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CHANGES_DIR = join(import.meta.dir, "..", "changes");
const CHANGELOG_PATH = join(import.meta.dir, "..", "CHANGELOG.md");

const TYPE_ORDER = [
  "security",
  "added",
  "changed",
  "fixed",
  "deprecated",
  "removed",
  "docs",
] as const;

const TYPE_HEADINGS: Record<string, string> = {
  security: "Security",
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  deprecated: "Deprecated",
  removed: "Removed",
  docs: "Documentation",
};

interface Fragment {
  slug: string;
  type: string;
  content: string;
  filename: string;
}

async function loadFragments(): Promise<Fragment[]> {
  const entries = await readdir(CHANGES_DIR);
  const fragments: Fragment[] = [];

  for (const filename of entries) {
    if (filename === "README.md" || !filename.endsWith(".md")) continue;

    const parts = filename.replace(/\.md$/, "").split(".");
    if (parts.length < 2) continue;

    const type = parts.pop()!;
    const slug = parts.join(".");

    if (!TYPE_ORDER.includes(type as (typeof TYPE_ORDER)[number])) {
      console.warn(`⚠️  Unknown fragment type "${type}" in ${filename}, skipping`);
      continue;
    }

    const content = (await readFile(join(CHANGES_DIR, filename), "utf-8")).trim();
    fragments.push({ slug, type, content, filename });
  }

  return fragments;
}

function renderEntry(fragments: Fragment[], version: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [`## [${version}] — ${date}`, ""];

  for (const type of TYPE_ORDER) {
    const matching = fragments.filter((f) => f.type === type);
    if (matching.length === 0) continue;

    lines.push(`### ${TYPE_HEADINGS[type]}`, "");
    for (const frag of matching) {
      lines.push(`- ${frag.content}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const mode = process.argv[2];

  if (!mode || !["draft", "compile"].includes(mode)) {
    console.log("Usage: bun run scripts/changelog.ts <draft|compile>");
    process.exit(1);
  }

  const fragments = await loadFragments();

  if (fragments.length === 0) {
    console.log("No changelog fragments found in changes/");
    process.exit(0);
  }

  // Read version from package.json
  const pkg = JSON.parse(await readFile(join(import.meta.dir, "..", "package.json"), "utf-8"));
  const version = pkg.version || "Unreleased";

  const entry = renderEntry(fragments, version);

  if (mode === "draft") {
    console.log("--- CHANGELOG DRAFT ---\n");
    console.log(entry);
    console.log(`--- ${fragments.length} fragment(s) would be compiled ---`);
    return;
  }

  // Compile: prepend to CHANGELOG.md
  let existing = "";
  try {
    existing = await readFile(CHANGELOG_PATH, "utf-8");
  } catch {
    existing = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
  }

  // Insert after the header
  const headerEnd = existing.indexOf("\n## ");
  let updated: string;
  if (headerEnd === -1) {
    updated = existing.trimEnd() + "\n\n" + entry;
  } else {
    updated = existing.slice(0, headerEnd) + "\n" + entry + existing.slice(headerEnd);
  }

  await writeFile(CHANGELOG_PATH, updated);
  console.log(`✅ Wrote ${fragments.length} fragment(s) to CHANGELOG.md`);

  // Remove compiled fragments
  for (const frag of fragments) {
    await unlink(join(CHANGES_DIR, frag.filename));
  }
  console.log(`🗑️  Cleared ${fragments.length} fragment(s) from changes/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
