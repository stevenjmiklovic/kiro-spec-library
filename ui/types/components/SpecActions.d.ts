import React from 'react';
import type { SpecDetail } from '../hooks/useSpecDetail.js';
interface Props {
    detail: SpecDetail;
}
/**
 * Build a repository web permalink from provenance, when a web URL template
 * can be derived from the remote. Returns null when no web URL is available
 * (e.g. SSH-only remotes or local sources) — the permalink is then disabled.
 */
export declare function buildPermalink(detail: SpecDetail): string | null;
export declare function SpecActions({ detail }: Props): React.ReactElement;
export {};
//# sourceMappingURL=SpecActions.d.ts.map