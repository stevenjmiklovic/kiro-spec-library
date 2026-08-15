interface BackendClient {
    baseUrl: string;
    token: string;
}
interface SearchSpecsParams {
    query: string;
    filters?: {
        type?: string;
        stage?: string;
        theme?: string;
        owner?: string;
        repository?: string;
    };
    limit?: number;
}
interface GetSpecContextParams {
    specId: string;
    revisionId?: string;
}
interface SubmitMetadataProposalParams {
    specId: string;
    baseRevision: number;
    metadataPatch: Record<string, unknown>;
    relationshipAdds?: Array<{
        targetSpecId: string;
        type: string;
        note?: string;
    }>;
    rationale: string;
}
export declare function searchSpecs(client: BackendClient, params: SearchSpecsParams): Promise<string>;
export declare function getSpecContext(client: BackendClient, params: GetSpecContextParams): Promise<string>;
/**
 * Submit a metadata proposal via the proposal queue (backend/src/routes/proposals.ts).
 * Supports both human-authored and auto-populated field proposals.
 * All proposals require human approval before being applied to the overlay.
 */
export declare function submitMetadataProposal(client: BackendClient, params: SubmitMetadataProposalParams): Promise<string>;
export {};
//# sourceMappingURL=tools.d.ts.map