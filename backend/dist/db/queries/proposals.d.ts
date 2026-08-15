import type { Database } from "bun:sqlite";
export interface ProposalRow {
    id: string;
    spec_key: string;
    patch: string;
    status: string;
    submitted_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    rationale: string | null;
    source: string | null;
}
export declare function createProposal(db: Database, params: {
    id: string;
    specKey: string;
    patch: Record<string, unknown>;
    submittedAt: string;
    rationale?: string;
    source?: string;
}): ProposalRow;
export declare function listPendingProposals(db: Database, specKey: string): ProposalRow[];
export declare function acceptProposal(db: Database, id: string): ProposalRow | null;
export declare function rejectProposal(db: Database, id: string): ProposalRow | null;
export declare function getProposal(db: Database, id: string): ProposalRow | null;
//# sourceMappingURL=proposals.d.ts.map