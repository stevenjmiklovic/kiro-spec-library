import React from "react";
export interface RelationshipFilters {
    scope: "team" | "mine";
    theme?: string;
    type?: string;
    stage?: string;
    owner?: string;
    repository?: string;
    metadataComplete?: boolean;
    query?: string;
}
export interface FilterOptions {
    themes: string[];
    owners: string[];
    repositories: string[];
}
interface Props {
    filters: RelationshipFilters;
    options: FilterOptions;
    onChange: (filters: RelationshipFilters) => void;
    resultCount: number;
}
export declare function FilterBar({ filters, options, onChange, resultCount }: Props): React.ReactElement;
export {};
//# sourceMappingURL=FilterBar.d.ts.map