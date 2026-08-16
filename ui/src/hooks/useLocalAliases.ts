/**
 * "Mine" scope filtering (RelationshipView.tsx) maps the current person to
 * their git author names/emails via this browser-local list — there's no
 * server-side user-identity concept in this app yet, so it's intentionally
 * client-only (per FilterBar.tsx's "Mine" tooltip).
 */
export const ALIASES_STORAGE_KEY = 'kiro-spec-library:aliases';

/** Read user aliases from localStorage (never throws; not an auth boundary). */
export function getLocalAliases(): string[] {
  try {
    const raw = localStorage.getItem(ALIASES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

export function setLocalAliases(aliases: string[]): void {
  localStorage.setItem(ALIASES_STORAGE_KEY, JSON.stringify(aliases));
}
