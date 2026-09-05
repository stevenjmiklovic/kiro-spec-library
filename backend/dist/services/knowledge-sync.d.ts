import type { Database } from "bun:sqlite";
import { getOverlay } from "../db/queries/metadata.js";
import { type SpecRow } from "../db/queries/specs.js";
export interface SpecArtifactBodies {
    /** filename -> full text, for each narrative artifact that exists and validated. */
    contents: Record<string, string>;
    /** True when a body was dropped/truncated to stay under the per-spec cap. */
    truncated: boolean;
}
/**
 * Read a spec's narrative artifact bodies off disk, mirroring the scanner's
 * exact path composition and `validatePath` security (traversal, symlink
 * escape, credential paths, size). `repoPath` is the source root:
 * `source.path` for local, `join(dataDir, "clones", source.id)` for remote —
 * the same mapping `scanner.scanSource` uses.
 *
 * A missing/oversized/unreadable file is skipped, never fatal: the sync must
 * still push the metadata document for a spec whose bodies can't be read.
 */
export declare function readSpecArtifactBodies(spec: SpecRow, repoPath: string, opts?: {
    fileReader?: (path: string) => Promise<string | null>;
}): Promise<SpecArtifactBodies>;
/** One spec's outgoing relationships, resolved to human spec-id targets. */
type OutgoingRel = {
    targetSpecId: string;
    targetRepository: string;
    type: string;
};
/**
 * Build the document text pushed to the Knowledge Library for one spec.
 *
 * The shape is deliberately prose-with-structure: the extractor reads it as a
 * design/spec document and lifts entities (the spec id, its owner, theme, and
 * every related spec id) plus relations. Because cross-document links in the
 * library form ONLY through shared entity names, naming each related spec by
 * its exact spec_id here is what wires two specs together in the graph.
 */
export declare function buildSpecKnowledgeDoc(spec: SpecRow, overlay: ReturnType<typeof getOverlay>, outgoing: OutgoingRel[], bodies?: SpecArtifactBodies): {
    title: string;
    content: string;
};
export interface KnowledgeSyncResult {
    attempted: number;
    added: number;
    duplicate: number;
    failed: number;
    /** Specs where at least one artifact body was skipped or truncated. */
    bodiesTruncated: number;
    errors: Array<{
        specId: string;
        error: string;
    }>;
    /** Set when the gateway rejected because knowledge.auto_add_documents is off. */
    disabled?: boolean;
}
export interface SingleSpecSyncResult {
    status: "added" | "duplicate" | "failed" | "disabled";
    specId: string;
    bodiesTruncated: boolean;
    error?: string;
}
/**
 * Push ONE spec to the Knowledge Library, by its spec key. Backs the UI's
 * per-spec "Send to Knowledge Library" button. Idempotent (re-sending an
 * unchanged spec is refused as a duplicate). Returns a typed status the UI
 * turns into a success/info/error toast; `null` when no spec has that key.
 */
export declare function syncOneSpecToKnowledgeLibrary(db: Database, specKey: string, opts?: {
    fetchImpl?: typeof fetch;
    dataDir?: string;
    fileReader?: (path: string) => Promise<string | null>;
}): Promise<SingleSpecSyncResult | null>;
export interface KnowledgeSyncResult {
    attempted: number;
    added: number;
    duplicate: number;
    failed: number;
    /** Specs where at least one artifact body was skipped or truncated. */
    bodiesTruncated: number;
    errors: Array<{
        specId: string;
        error: string;
    }>;
    /** Set when the gateway rejected because knowledge.auto_add_documents is off. */
    disabled?: boolean;
}
/**
 * Serialize every indexed spec and push it to the Knowledge Library, one
 * document per spec. Idempotent: re-running replaces changed specs and skips
 * unchanged ones (the library refuses identical content per source_uri).
 *
 * Each document includes the spec's full requirements/design/tasks bodies,
 * read off disk via the same path composition and `validatePath` security the
 * scanner uses. `dataDir` resolves remote clones (`clones/<source.id>`); when
 * omitted, remote-source bodies are skipped (their metadata still syncs).
 *
 * Sequential on purpose — each push triggers LLM extraction (one call per
 * chunk) on the gateway's bounded worker pool, so firing all specs at once
 * would just queue behind that pool while multiplying failure blast radius.
 */
export declare function syncSpecsToKnowledgeLibrary(db: Database, opts?: {
    fetchImpl?: typeof fetch;
    /** Application data dir — needed to resolve remote clones (clones/<id>). */
    dataDir?: string;
    /** Test seam for reading artifact files. */
    fileReader?: (path: string) => Promise<string | null>;
}): Promise<KnowledgeSyncResult>;
export {};
//# sourceMappingURL=knowledge-sync.d.ts.map