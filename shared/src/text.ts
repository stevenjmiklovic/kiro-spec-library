/**
 * Shared, deterministic title-casing for spec names derived from slugs.
 *
 * A spec's display name comes from the author's `# Heading` when present; only
 * when a title must be derived from the folder slug do we title-case it. Naive
 * word-capitalisation mangles acronyms ("llm" -> "Llm", "sql" -> "Sql"), which
 * then renders inconsistently across the list, board, and relationship surfaces
 * that each re-derived the name. This module is the single source of truth so
 * every surface produces the same string.
 */

/**
 * Acronyms and initialisms that keep a fixed casing, keyed by the lowercased
 * slug word so lookup is case-insensitive. Extend this list rather than adding
 * ad-hoc casing logic at a call site.
 */
export const TITLE_ACRONYMS: Readonly<Record<string, string>> = {
  llm: "LLM",
  sql: "SQL",
  crdt: "CRDT",
  api: "API",
  mcp: "MCP",
  ui: "UI",
  ux: "UX",
  cli: "CLI",
  ci: "CI",
  cd: "CD",
  id: "ID",
  url: "URL",
  http: "HTTP",
  https: "HTTPS",
  json: "JSON",
  yaml: "YAML",
  html: "HTML",
  css: "CSS",
  db: "DB",
  ssh: "SSH",
  tls: "TLS",
  jwt: "JWT",
  oauth: "OAuth",
  aws: "AWS",
  s3: "S3",
  ec2: "EC2",
  ecs: "ECS",
  iam: "IAM",
  adr: "ADR",
  fts: "FTS",
  bfs: "BFS",
  dfs: "DFS",
  tf: "TF",
  gc: "GC",
  vm: "VM",
  os: "OS",
  io: "IO",
  gpg: "GPG",
  pr: "PR",
  e2e: "E2E",
  a11y: "A11y",
  i18n: "i18n",
  tui: "TUI",
  ttl: "TTL",
  uuid: "UUID",
};

/** Title-case a single word, preserving known acronym casing. */
export function titleCaseWord(word: string): string {
  if (word === "") return word;
  const acronym = TITLE_ACRONYMS[word.toLowerCase()];
  if (acronym) return acronym;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Title-case a hyphen- or space-delimited slug into a display name, preserving
 * acronym casing. `"llm-budget-control"` -> `"LLM Budget Control"`.
 */
export function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-\s]+/)
    .filter((w) => w !== "")
    .map(titleCaseWord)
    .join(" ");
}
