# ADR-003: Use in-process TF-IDF for relationship suggestions

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The Spec Library generates deterministic relationship suggestions between specs based on content similarity, shared metadata, cross-references, and repository proximity (Requirement 7.3). The similarity engine must produce consistent results across invocations and operate without external services or embedded LLMs (per v1 scope constraints).

## Decision Drivers

- Must be deterministic: identical inputs produce identical suggestions (Requirement 7.3)
- No embedded LLM or vector database in v1 scope
- Must run within the single-process backend during scan cycles
- Confidence threshold (0.3) and per-spec limit (5) constrain output volume
- Pairwise comparison is acceptable at expected catalog size (< 5,000 specs)

## Considered Options

1. In-process TF-IDF with pairwise cosine similarity
2. Pre-computed embeddings with approximate nearest neighbor (ANN) search
3. Rule-based only (tags, links, proximity — no content similarity)

## Decision Outcome

**Chosen option:** Option 1 — In-process TF-IDF with pairwise cosine similarity, because it is fully deterministic, requires no external dependencies, and provides meaningful content-based suggestions at the expected scale.

### Positive Consequences

- Fully deterministic — same content always produces same vectors and same similarity scores
- Zero dependencies — standard algorithm implemented in ~100 lines of TypeScript
- Multi-signal: combines content similarity with tag overlap, theme matching, markdown links, and repository proximity
- Results are explainable (confidence scores, reason labels, evidence text)

### Negative Consequences / Trade-offs

- O(n²) pairwise comparison: at 5,000 specs this is ~12.5M comparisons per scan cycle
- Bag-of-words model misses semantic similarity (synonyms, related concepts with different terminology)
- Stop-word list and tokenizer are English-biased
- TF-IDF vectors are recomputed on every scan (no incremental updates)
- At very large catalog sizes (>10K specs), scan cycle may exceed 15-minute interval

## Options Analysis

### Option 1: In-process TF-IDF
**Pros:** Deterministic, zero-dep, explainable, no infrastructure, well-understood algorithm
**Cons:** O(n²), no semantic understanding, English-biased tokenization, full recomputation per scan

### Option 2: Pre-computed embeddings + ANN
**Pros:** Semantic similarity, sub-linear search via HNSW/IVF, handles synonyms
**Cons:** Requires embedding model (external API or bundled model), non-deterministic across model versions, adds ~200MB+ for a local model, violates "no embedded LLM" scope constraint

### Option 3: Rule-based only (no content similarity)
**Pros:** Simplest, fastest, fully deterministic, no NLP
**Cons:** Misses content relationships entirely — two specs discussing the same API in different words would never be linked. Defeats the purpose of intelligent suggestions.

## Links and References

- Relates to: [ADR-002](./ADR-002-fts5-fulltext-search.md) (search infrastructure)
- Implementation: `backend/src/services/suggester.ts`
- Requirements: 7.3, 7.4
- Branch: main
