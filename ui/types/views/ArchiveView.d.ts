import React from 'react';
/** A normalized archive snapshot for display. */
export interface ArchiveSnapshot {
    id: string;
    specKey: string;
    title: string;
    type: string;
    theme: string;
    owner: string;
    repository: string;
    tags: string[];
    /** ISO 8601 */
    createdAt: string;
    /** e.g. "August 2026" — grouping key */
    monthLabel: string;
    /** e.g. "Aug 7, 2026" */
    dateLabel: string;
    retentionLabel: string;
    legalHoldActive: boolean;
    legalHoldReason?: string;
    metadataComplete: boolean;
    contentDigest: string;
    provenance: {
        repository: string;
        relativePath: string;
        branch: string;
        commitHash: string;
    };
}
export declare function ArchiveView(): React.ReactElement;
//# sourceMappingURL=ArchiveView.d.ts.map