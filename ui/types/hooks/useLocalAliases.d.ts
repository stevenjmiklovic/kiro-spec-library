/**
 * "Mine" scope filtering (RelationshipView.tsx) maps the current person to
 * their git author names/emails via this browser-local list — there's no
 * server-side user-identity concept in this app yet, so it's intentionally
 * client-only (per FilterBar.tsx's "Mine" tooltip).
 */
export declare const ALIASES_STORAGE_KEY = "kiro-spec-library:aliases";
/** Read user aliases from localStorage (never throws; not an auth boundary). */
export declare function getLocalAliases(): string[];
export declare function setLocalAliases(aliases: string[]): void;
//# sourceMappingURL=useLocalAliases.d.ts.map