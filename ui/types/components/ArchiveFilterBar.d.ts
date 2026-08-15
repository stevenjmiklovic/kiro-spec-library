import React from 'react';
export interface ArchiveFilters {
    query?: string;
    type?: string;
    theme?: string;
    repository?: string;
    owner?: string;
    fromDate?: string;
    toDate?: string;
    retention?: string;
    legalHold?: 'active' | 'none';
    metadataComplete?: boolean;
}
export interface ArchiveFilterOptions {
    types: string[];
    themes: string[];
    owners: string[];
    repositories: string[];
}
interface Props {
    filters: ArchiveFilters;
    options: ArchiveFilterOptions;
    onChange: (filters: ArchiveFilters) => void;
    resultCount: number;
}
export declare function ArchiveFilterBar({ filters, options, onChange, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=ArchiveFilterBar.d.ts.map