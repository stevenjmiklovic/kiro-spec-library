// Suggestion engine — TF-IDF, cosine similarity, cross-spec link detection
import { createHash } from "node:crypto";
import type {
  NormalizedSpec,
  RelationshipType,
  Suggestion,
} from "@kiro-spec-library/shared";
import {
  CONFIDENCE_WEIGHTS,
  MAX_SUGGESTIONS_PER_SPEC,
  SUGGESTION_THRESHOLD,
} from "@kiro-spec-library/shared";
import type { ResolvedMetadata } from "./metadata.js";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Text Processing ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "this", "that",
  "these", "those", "it", "its", "not", "no", "if", "then", "else",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// ─── TF-IDF ──────────────────────────────────────────────────────────────────

/**
 * Build TF-IDF vectors for a corpus of documents.
 */
export function buildTfIdfVectors(
  documents: Map<string, string>,
): Map<string, TfIdfVector> {
  const N = documents.size;
  if (N === 0) return new Map();

  // Compute document frequency for each term
  const df = new Map<string, number>();
  const tokensByDoc = new Map<string, string[]>();

  for (const [key, content] of documents) {
    const tokens = tokenize(content);
    tokensByDoc.set(key, tokens);
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Compute TF-IDF for each document
  const vectors = new Map<string, TfIdfVector>();

  for (const [key, tokens] of tokensByDoc) {
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }

    const vector: TfIdfVector = new Map();
    const docLen = tokens.length || 1;

    for (const [term, count] of tf) {
      const termFreq = count / docLen;
      const inverseDocFreq = Math.log(N / (df.get(term) ?? 1));
      const tfidf = termFreq * inverseDocFreq;
      if (tfidf > 0) {
        vector.set(term, tfidf);
      }
    }

    vectors.set(key, vector);
  }

  return vectors;
}

/**
 * Cosine similarity between two TF-IDF vectors.
 * Returns a value in [0, 1].
 */
export function cosineSimilarity(a: TfIdfVector, b: TfIdfVector): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const [term, weightA] of a) {
    magnitudeA += weightA * weightA;
    const weightB = b.get(term);
    if (weightB !== undefined) {
      dotProduct += weightA * weightB;
    }
  }

  for (const [, weightB] of b) {
    magnitudeB += weightB * weightB;
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) return 0;

  return Math.min(1.0, Math.max(0.0, dotProduct / magnitude));
}

// ─── Link Extraction ─────────────────────────────────────────────────────────

/**
 * Extract cross-spec markdown links from content.
 * Looks for references like `.kiro/specs/<slug>` or `specId` patterns.
 */
export function extractMarkdownLinks(
  content: string,
  currentSpecKey: string,
  knownKeys: Set<string>,
): LinkReference[] {
  const refs: LinkReference[] = [];

  // Match .kiro/specs/<slug> patterns
  const specPathRegex = /\.kiro\/specs\/([a-z0-9-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = specPathRegex.exec(content)) !== null) {
    const slug = match[1]!;
    // Try to find a matching key
    for (const key of knownKeys) {
      if (key !== currentSpecKey && key.includes(slug)) {
        refs.push({
          targetKey: key,
          context: content.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20),
        });
        break;
      }
    }
  }

  // Match explicit [link](../other-spec/) patterns
  const linkRegex = /\[([^\]]+)\]\(\.\.\/([a-z0-9-]+)\/?[^)]*\)/g;
  while ((match = linkRegex.exec(content)) !== null) {
    const slug = match[2]!;
    for (const key of knownKeys) {
      if (key !== currentSpecKey && key.includes(slug)) {
        refs.push({
          targetKey: key,
          context: match[0],
        });
        break;
      }
    }
  }

  return refs;
}

// ─── Proximity ───────────────────────────────────────────────────────────────

/**
 * Check whether two specs are proximate (same repo or adjacent directories).
 */
export function isProximate(
  a: NormalizedSpec,
  b: NormalizedSpec,
): boolean {
  // Same repository
  if (a.provenance.repository !== b.provenance.repository) return false;

  // Adjacent directories (sibling specs in the same .kiro/specs/)
  const aDir = a.provenance.relativePath.replace(/\/[^/]+$/, "");
  const bDir = b.provenance.relativePath.replace(/\/[^/]+$/, "");
  return aDir === bDir;
}

// ─── Filtering ───────────────────────────────────────────────────────────────

/**
 * Filter out suggestions that were previously rejected,
 * unless the underlying data has changed (different dataHash).
 */
export function filterRejected(
  suggestions: Suggestion[],
  rejections: RejectionRecord[],
): Suggestion[] {
  const rejectionIndex = new Map<string, string>();
  for (const r of rejections) {
    const key = `${r.sourceSpecKey}|${r.targetSpecKey}|${r.type}`;
    rejectionIndex.set(key, r.dataHash);
  }

  return suggestions.filter((s) => {
    const key = `${s.sourceSpecKey}|${s.targetSpecKey}|${s.type}`;
    const rejectedHash = rejectionIndex.get(key);
    // Keep if never rejected, or if data has changed since rejection
    return rejectedHash === undefined || rejectedHash !== s.dataHash;
  });
}

// ─── Data Hash ───────────────────────────────────────────────────────────────

function computeDataHash(specA: NormalizedSpec, specB: NormalizedSpec): string {
  const combined = [specA.contentDigest, specB.contentDigest].sort().join("|");
  return createHash("sha256").update(combined).digest("hex").slice(0, 16);
}

// ─── Main Generation ─────────────────────────────────────────────────────────

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
export function generateAll(
  specs: NormalizedSpec[],
  metadataMap: Map<string, ResolvedMetadata>,
  contentMap: Map<string, string> = new Map(),
  rejections: RejectionRecord[] = [],
): Suggestion[] {
  if (specs.length < 2) return [];

  const candidates: Suggestion[] = [];
  const knownKeys = new Set(specs.map((s) => s.key));

  // Build documents for TF-IDF: use actual content when available, fall back to metadata
  const documents = new Map<string, string>();
  for (const spec of specs) {
    const meta = metadataMap.get(spec.key);
    const rawContent = contentMap.get(spec.key) ?? "";
    const doc = [
      spec.title,
      meta?.theme ?? "",
      (meta?.tags ?? []).join(" "),
      rawContent,
    ].join(" ");
    documents.set(spec.key, doc);
  }

  const vectors = buildTfIdfVectors(documents);

  // Pairwise analysis
  for (let i = 0; i < specs.length; i++) {
    const a = specs[i]!;
    const metaA = metadataMap.get(a.key);

    for (let j = i + 1; j < specs.length; j++) {
      const b = specs[j]!;
      const metaB = metadataMap.get(b.key);
      const dataHash = computeDataHash(a, b);
      const base = {
        id: "",
        sourceSpecKey: a.key,
        targetSpecKey: b.key,
        type: "related" as RelationshipType,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        dataHash,
      };

      // Content similarity
      const vecA = vectors.get(a.key);
      const vecB = vectors.get(b.key);
      if (vecA && vecB) {
        const sim = cosineSimilarity(vecA, vecB);
        if (sim >= SUGGESTION_THRESHOLD) {
          candidates.push({
            ...base,
            id: crypto.randomUUID(),
            confidence: sim,
            reason: "content_similarity",
            evidence: `Content similarity: ${(sim * 100).toFixed(0)}%`,
          });
        }
      }

      // Shared tags
      const tagsA = metaA?.tags ?? [];
      const tagsB = metaB?.tags ?? [];
      const shared = tagsA.filter((t) => tagsB.includes(t));
      if (shared.length > 0) {
        const confidence = Math.min(
          1.0,
          CONFIDENCE_WEIGHTS.shared_tags_base +
            CONFIDENCE_WEIGHTS.shared_tags_increment * shared.length,
        );
        candidates.push({
          ...base,
          id: crypto.randomUUID(),
          confidence,
          reason: "shared_tags",
          evidence: `Shared tags: ${shared.join(", ")}`,
        });
      }

      // Shared theme
      if (metaA?.theme && metaB?.theme && metaA.theme === metaB.theme) {
        candidates.push({
          ...base,
          id: crypto.randomUUID(),
          confidence: CONFIDENCE_WEIGHTS.shared_theme,
          reason: "shared_theme",
          evidence: `Shared theme: ${metaA.theme}`,
        });
      }

      // Repository proximity
      if (isProximate(a, b)) {
        candidates.push({
          ...base,
          id: crypto.randomUUID(),
          confidence: CONFIDENCE_WEIGHTS.repository_proximity,
          reason: "repository_proximity",
          evidence: `Same spec directory: ${a.provenance.repository}`,
        });
      }
    }
  }

  // Markdown link suggestions (higher confidence) — uses raw content for link detection
  for (const spec of specs) {
    const rawContent = contentMap.get(spec.key) ?? "";
    if (!rawContent) continue;
    const links = extractMarkdownLinks(rawContent, spec.key, knownKeys);
    for (const link of links) {
      const target = specs.find((s) => s.key === link.targetKey);
      if (!target) continue;
      const dataHash = computeDataHash(spec, target);
      candidates.push({
        id: crypto.randomUUID(),
        sourceSpecKey: spec.key,
        targetSpecKey: link.targetKey,
        type: "related",
        confidence: CONFIDENCE_WEIGHTS.markdown_link,
        reason: "markdown_link",
        evidence: `Explicit link: ${link.context}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        dataHash,
      });
    }
  }

  // Deduplicate: keep highest confidence per (source, target, type)
  const deduped = new Map<string, Suggestion>();
  for (const c of candidates) {
    const dedupKey = [c.sourceSpecKey, c.targetSpecKey, c.type].sort().join("|") + "|" + c.reason;
    const existing = deduped.get(dedupKey);
    if (!existing || c.confidence > existing.confidence) {
      deduped.set(dedupKey, c);
    }
  }

  // Filter rejected
  let results = filterRejected([...deduped.values()], rejections);

  // Filter below threshold
  results = results.filter((s) => s.confidence >= SUGGESTION_THRESHOLD);

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  // Limit per spec
  const countPerSpec = new Map<string, number>();
  const limited: Suggestion[] = [];
  for (const s of results) {
    const countA = countPerSpec.get(s.sourceSpecKey) ?? 0;
    const countB = countPerSpec.get(s.targetSpecKey) ?? 0;
    if (countA >= MAX_SUGGESTIONS_PER_SPEC || countB >= MAX_SUGGESTIONS_PER_SPEC) {
      continue;
    }
    limited.push(s);
    countPerSpec.set(s.sourceSpecKey, countA + 1);
    countPerSpec.set(s.targetSpecKey, countB + 1);
  }

  return limited;
}
