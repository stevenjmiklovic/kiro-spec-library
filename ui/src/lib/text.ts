/**
 * UI re-export of the shared acronym-aware title-casing (shared/src/text.ts),
 * via a relative path — the UI bundle resolves the workspace barrel
 * inconsistently under `tsc`, but a direct relative import to the pure,
 * dependency-free module resolves cleanly and keeps the acronym allow-list in
 * ONE place, so the two contexts cannot drift.
 */
export { titleCaseWord, titleCaseSlug, TITLE_ACRONYMS } from "../../../shared/src/text.js";
