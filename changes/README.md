# Changelog Fragments

This directory holds changelog fragments — small files that each describe one notable change. They are compiled into `CHANGELOG.md` at release time.

## Creating a Fragment

```bash
# Format: <short-slug>.<type>.md
# Types: added, changed, fixed, removed, deprecated, security, docs
echo "Added SQLite migration runner with numbered migrations." > changes/db-migrator.added.md
```

Each fragment is a single file containing one or more sentences (past tense) describing the change from a user's perspective. One fragment per logical change.

## Fragment Types

| Type | Description |
|------|-------------|
| `added` | New feature or capability |
| `changed` | Change to existing functionality |
| `fixed` | Bug fix |
| `removed` | Removed feature |
| `deprecated` | Feature marked for future removal |
| `security` | Security-related change |
| `docs` | Documentation or ADR |

## Compiling the Changelog

At release time, run:

```bash
bun run changelog:draft    # Preview the next entry
bun run changelog:compile  # Write to CHANGELOG.md and clear fragments
```

## Convention

- File name should be a short kebab-case slug describing the change
- Content should be past tense, user-facing language
- One fragment per PR/change — don't bundle unrelated things
- ADR fragments: `ADR-NNN-title.docs.md`
