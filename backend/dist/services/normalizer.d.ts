import type { ArtifactManifest, ConfigKiro, LifecycleStage, NormalizedSpec, Source, SpecProvenance, SpecType, TaskCounts, WorkflowType } from '@kiro-spec-library/shared';
export interface RawSpecArtifacts {
    slug: string;
    relativePath: string;
    config: ConfigKiro | null;
    contents: Record<string, string>;
    provenance: SpecProvenance;
}
export declare function deriveKey(sourceId: string, specId: string | null, relativePath: string): string;
export declare function classifyType(artifacts: ArtifactManifest, config: ConfigKiro | null): SpecType;
export declare function classifyWorkflow(artifacts: ArtifactManifest): WorkflowType;
export declare function extractTitle(content: string | undefined, fallbackSlug: string): string;
export declare function calculateStage(artifacts: ArtifactManifest, taskCounts: TaskCounts): LifecycleStage;
export declare function calculateProgress(artifacts: ArtifactManifest, taskCounts: TaskCounts): number;
export declare function countTasks(tasksContent: string | undefined): TaskCounts;
export declare function normalize(raw: RawSpecArtifacts, source: Source): NormalizedSpec;
//# sourceMappingURL=normalizer.d.ts.map