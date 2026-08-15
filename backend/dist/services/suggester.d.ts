import type { NormalizedSpec, Suggestion } from "@kiro-spec-library/shared";
import type { ResolvedMetadata } from "./metadata.js";
export type TfIdfVector = Map<string, number>;
export interface LinkReference {
    targetKey: string;
    context: string;
}
interface RejectionRecord {
    sourceSpecKey: string;
    targetSpecKey: string;
    type: string;
    dataHash: string;
}
/**
 * Build TF-IDF vectors for a corpus of documents.
 */
export declare function buildTfIdfVectors(documents: Map<string, string>): Map<string, TfIdfVector>;
/**
 * Cosine similarity between two TF-IDF vectors.
 * Returns a value in [0, 1].
 */
export declare function cosineSimilarity(a: TfIdfVector, b: TfIdfVector): number;
/**
 * Extract cross-spec markdown links from content.
 * Looks for references like `.kiro/specs/<slug>` or `specId` patterns.
 */
export declare function extractMarkdownLinks(content: string, currentSpecKey: string, knownKeys: Set<string>): LinkReference[];
/**
 * Check whether two specs are proximate (same repo or adjacent directories).
 */
export declare function isProximate(a: NormalizedSpec, b: NormalizedSpec): boolean;
/**
 * Filter out suggestions that were previously rejected,
 * unless the underlying data has changed (different dataHash).
 */
export declare function filterRejected(suggestions: Suggestion[], rejections: RejectionRecord[]): Suggestion[];
/**
 * Generate all suggestions for a set of specs.
 * Orchestrates: content similarity, markdown links, shared tags/theme, proximity.
 * Deduplicates, filters rejected, and limits to MAX_SUGGESTIONS_PER_SPEC per spec.
 *
 * @param specs - Normalized specs to analyze
 * @param metadataMap - Resolved metadata per spec key
 * @param contentMap - Optional raw artifact content per spec key (for TF-IDF and link extraction)
 * @param rejections - Previously rejected suggestions
 */
export declare function generateAll(specs: NormalizedSpec[], metadataMap: Map<string, ResolvedMetadata>, contentMap?: Map<string, string>, rejections?: RejectionRecord[]): Suggestion[];
export {};
//# sourceMappingURL=suggester.d.ts.map