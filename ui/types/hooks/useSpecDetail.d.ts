export interface SpecDetailProvenance {
    repository: string;
    relativePath: string;
    branch: string;
    commitHash: string;
    isDirty: boolean;
    remoteUrl?: string;
}
export interface SpecDetailMetadata {
    title: string;
    summary?: string;
    owner: string;
    theme?: string;
    tags: string[];
    targetRelease?: string;
    retentionPolicy?: {
        type: string;
        customDate?: string;
    };
    legalHold?: {
        active: boolean;
        reason?: string;
    };
    approvers: string[];
    implementationRef?: string;
}
export interface SpecDetail {
    key: string;
    specId: string;
    type: string;
    stage: string;
    progress: number;
    revision: number;
    metadata: SpecDetailMetadata;
    provenance: SpecDetailProvenance;
    createdAt: string;
    completedAt?: string;
}
/** A pending metadata/relationship suggestion awaiting accept/reject. */
export interface PendingSuggestion {
    id: string;
    targetSpecKey: string;
    type: string;
    confidence: number;
    reason: string;
    evidence: string;
}
export interface MetadataPatch {
    title?: string;
    summary?: string;
    owner?: string;
    theme?: string;
    tags?: string[];
    targetRelease?: string;
    retentionPolicy?: {
        type: string;
        customDate?: string;
    };
    legalHold?: {
        active: boolean;
        reason?: string;
    };
    implementationRef?: string;
}
/** A pending metadata proposal from an agent awaiting human approval. */
export interface PendingProposal {
    id: string;
    specKey: string;
    patch: Record<string, unknown>;
    status: 'pending' | 'accepted' | 'rejected';
    submittedAt: string;
    rationale?: string;
    source?: string;
}
export interface UseSpecDetailResult {
    detail: SpecDetail | null;
    suggestions: PendingSuggestion[];
    proposals: PendingProposal[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    /** Apply a metadata patch with optimistic-concurrency retry on conflict. */
    save: (patch: MetadataPatch) => Promise<boolean>;
    acceptSuggestion: (id: string) => Promise<void>;
    rejectSuggestion: (id: string) => Promise<void>;
    acceptProposal: (id: string) => Promise<void>;
    rejectProposal: (id: string) => Promise<void>;
    refetch: () => void;
}
/**
 * Loads full detail + pending suggestions for a single spec and provides
 * metadata editing (with optimistic-concurrency retry) and suggestion
 * accept/reject. Pass `undefined` to clear.
 */
export declare function useSpecDetail(specKey: string | undefined): UseSpecDetailResult;
//# sourceMappingURL=useSpecDetail.d.ts.map