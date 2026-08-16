import { z } from "zod";
export declare const ConfigKiroSchema: z.ZodObject<{
    specId: z.ZodString;
    workflowType: z.ZodOptional<z.ZodEnum<["requirements-first", "design-first"]>>;
    specType: z.ZodOptional<z.ZodEnum<["feature", "bugfix", "quick"]>>;
}, "strip", z.ZodTypeAny, {
    specId: string;
    workflowType?: "requirements-first" | "design-first" | undefined;
    specType?: "feature" | "bugfix" | "quick" | undefined;
}, {
    specId: string;
    workflowType?: "requirements-first" | "design-first" | undefined;
    specType?: "feature" | "bugfix" | "quick" | undefined;
}>;
export type ConfigKiro = z.infer<typeof ConfigKiroSchema>;
export declare const RetentionPolicySchema: z.ZodEffects<z.ZodObject<{
    type: z.ZodEnum<[string, ...string[]]>;
    customDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    customDate?: string | undefined;
}, {
    type: string;
    customDate?: string | undefined;
}>, {
    type: string;
    customDate?: string | undefined;
}, {
    type: string;
    customDate?: string | undefined;
}>;
export declare const SidecarRelationshipSchema: z.ZodObject<{
    targetSpecId: z.ZodString;
    targetRepository: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<[string, ...string[]]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    targetSpecId: string;
    targetRepository?: string | undefined;
    note?: string | undefined;
}, {
    type: string;
    targetSpecId: string;
    targetRepository?: string | undefined;
    note?: string | undefined;
}>;
export declare const SidecarMetadataSchema: z.ZodObject<{
    displayTitle: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    theme: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    owner: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
    }, {
        name: string;
        email?: string | undefined;
    }>>;
    targetRelease: z.ZodOptional<z.ZodString>;
    retentionPolicy: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        type: z.ZodEnum<[string, ...string[]]>;
        customDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        customDate?: string | undefined;
    }, {
        type: string;
        customDate?: string | undefined;
    }>, {
        type: string;
        customDate?: string | undefined;
    }, {
        type: string;
        customDate?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    displayTitle?: string | undefined;
    summary?: string | undefined;
    theme?: string | undefined;
    tags?: string[] | undefined;
    owner?: {
        name: string;
        email?: string | undefined;
    } | undefined;
    targetRelease?: string | undefined;
    retentionPolicy?: {
        type: string;
        customDate?: string | undefined;
    } | undefined;
}, {
    displayTitle?: string | undefined;
    summary?: string | undefined;
    theme?: string | undefined;
    tags?: string[] | undefined;
    owner?: {
        name: string;
        email?: string | undefined;
    } | undefined;
    targetRelease?: string | undefined;
    retentionPolicy?: {
        type: string;
        customDate?: string | undefined;
    } | undefined;
}>;
export declare const SpecLibrarySidecarV1Schema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    specId: z.ZodString;
    metadata: z.ZodObject<{
        displayTitle: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        owner: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            email?: string | undefined;
        }, {
            name: string;
            email?: string | undefined;
        }>>;
        targetRelease: z.ZodOptional<z.ZodString>;
        retentionPolicy: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            type: z.ZodEnum<[string, ...string[]]>;
            customDate: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            customDate?: string | undefined;
        }, {
            type: string;
            customDate?: string | undefined;
        }>, {
            type: string;
            customDate?: string | undefined;
        }, {
            type: string;
            customDate?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        displayTitle?: string | undefined;
        summary?: string | undefined;
        theme?: string | undefined;
        tags?: string[] | undefined;
        owner?: {
            name: string;
            email?: string | undefined;
        } | undefined;
        targetRelease?: string | undefined;
        retentionPolicy?: {
            type: string;
            customDate?: string | undefined;
        } | undefined;
    }, {
        displayTitle?: string | undefined;
        summary?: string | undefined;
        theme?: string | undefined;
        tags?: string[] | undefined;
        owner?: {
            name: string;
            email?: string | undefined;
        } | undefined;
        targetRelease?: string | undefined;
        retentionPolicy?: {
            type: string;
            customDate?: string | undefined;
        } | undefined;
    }>;
    relationships: z.ZodOptional<z.ZodArray<z.ZodObject<{
        targetSpecId: z.ZodString;
        targetRepository: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<[string, ...string[]]>;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        targetSpecId: string;
        targetRepository?: string | undefined;
        note?: string | undefined;
    }, {
        type: string;
        targetSpecId: string;
        targetRepository?: string | undefined;
        note?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    specId: string;
    schemaVersion: 1;
    metadata: {
        displayTitle?: string | undefined;
        summary?: string | undefined;
        theme?: string | undefined;
        tags?: string[] | undefined;
        owner?: {
            name: string;
            email?: string | undefined;
        } | undefined;
        targetRelease?: string | undefined;
        retentionPolicy?: {
            type: string;
            customDate?: string | undefined;
        } | undefined;
    };
    relationships?: {
        type: string;
        targetSpecId: string;
        targetRepository?: string | undefined;
        note?: string | undefined;
    }[] | undefined;
}, {
    specId: string;
    schemaVersion: 1;
    metadata: {
        displayTitle?: string | undefined;
        summary?: string | undefined;
        theme?: string | undefined;
        tags?: string[] | undefined;
        owner?: {
            name: string;
            email?: string | undefined;
        } | undefined;
        targetRelease?: string | undefined;
        retentionPolicy?: {
            type: string;
            customDate?: string | undefined;
        } | undefined;
    };
    relationships?: {
        type: string;
        targetSpecId: string;
        targetRepository?: string | undefined;
        note?: string | undefined;
    }[] | undefined;
}>;
export type SpecLibrarySidecarV1 = z.infer<typeof SpecLibrarySidecarV1Schema>;
export declare const TextExportManifestSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    exportedAt: z.ZodString;
    counts: z.ZodObject<{
        sources: z.ZodNumber;
        specs: z.ZodNumber;
        suggestions: z.ZodNumber;
        rejections: z.ZodNumber;
        proposals: z.ZodNumber;
        snapshots: z.ZodNumber;
        auditEvents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sources: number;
        specs: number;
        suggestions: number;
        rejections: number;
        proposals: number;
        snapshots: number;
        auditEvents: number;
    }, {
        sources: number;
        specs: number;
        suggestions: number;
        rejections: number;
        proposals: number;
        snapshots: number;
        auditEvents: number;
    }>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    exportedAt: string;
    counts: {
        sources: number;
        specs: number;
        suggestions: number;
        rejections: number;
        proposals: number;
        snapshots: number;
        auditEvents: number;
    };
}, {
    schemaVersion: 1;
    exportedAt: string;
    counts: {
        sources: number;
        specs: number;
        suggestions: number;
        rejections: number;
        proposals: number;
        snapshots: number;
        auditEvents: number;
    };
}>;
export type TextExportManifest = z.infer<typeof TextExportManifestSchema>;
export declare const TextExportSourceSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["local", "remote"]>;
    path: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    webUrlTemplate: z.ZodOptional<z.ZodString>;
    addedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "local" | "remote";
    id: string;
    addedAt: string;
    path?: string | undefined;
    url?: string | undefined;
    branch?: string | undefined;
    webUrlTemplate?: string | undefined;
}, {
    type: "local" | "remote";
    id: string;
    addedAt: string;
    path?: string | undefined;
    url?: string | undefined;
    branch?: string | undefined;
    webUrlTemplate?: string | undefined;
}>;
export type TextExportSource = z.infer<typeof TextExportSourceSchema>;
export declare const TextExportSuggestionSchema: z.ZodObject<{
    source: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    target: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    type: z.ZodEnum<[string, ...string[]]>;
    confidence: z.ZodNumber;
    reason: z.ZodString;
    evidence: z.ZodString;
    status: z.ZodEnum<["pending", "accepted", "rejected"]>;
    createdAt: z.ZodString;
    resolvedAt: z.ZodOptional<z.ZodString>;
    dataHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    status: "pending" | "accepted" | "rejected";
    source: {
        specId: string;
        repository: string;
    };
    target: {
        specId: string;
        repository: string;
    };
    confidence: number;
    reason: string;
    evidence: string;
    createdAt: string;
    dataHash: string;
    resolvedAt?: string | undefined;
}, {
    type: string;
    status: "pending" | "accepted" | "rejected";
    source: {
        specId: string;
        repository: string;
    };
    target: {
        specId: string;
        repository: string;
    };
    confidence: number;
    reason: string;
    evidence: string;
    createdAt: string;
    dataHash: string;
    resolvedAt?: string | undefined;
}>;
export type TextExportSuggestion = z.infer<typeof TextExportSuggestionSchema>;
export declare const TextExportRejectionSchema: z.ZodObject<{
    source: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    target: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    type: z.ZodEnum<[string, ...string[]]>;
    dataHash: z.ZodString;
    rejectedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    source: {
        specId: string;
        repository: string;
    };
    target: {
        specId: string;
        repository: string;
    };
    dataHash: string;
    rejectedAt: string;
}, {
    type: string;
    source: {
        specId: string;
        repository: string;
    };
    target: {
        specId: string;
        repository: string;
    };
    dataHash: string;
    rejectedAt: string;
}>;
export type TextExportRejection = z.infer<typeof TextExportRejectionSchema>;
export declare const TextExportProposalSchema: z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    patch: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodEnum<["pending", "accepted", "rejected"]>;
    submittedAt: z.ZodString;
    submittedBy: z.ZodOptional<z.ZodString>;
    resolvedAt: z.ZodOptional<z.ZodString>;
    resolvedBy: z.ZodOptional<z.ZodString>;
    rationale: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    spec: {
        specId: string;
        repository: string;
    };
    patch: Record<string, unknown>;
    submittedAt: string;
    source?: string | undefined;
    resolvedAt?: string | undefined;
    submittedBy?: string | undefined;
    resolvedBy?: string | undefined;
    rationale?: string | undefined;
}, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    spec: {
        specId: string;
        repository: string;
    };
    patch: Record<string, unknown>;
    submittedAt: string;
    source?: string | undefined;
    resolvedAt?: string | undefined;
    submittedBy?: string | undefined;
    resolvedBy?: string | undefined;
    rationale?: string | undefined;
}>;
export type TextExportProposal = z.infer<typeof TextExportProposalSchema>;
export declare const TextExportSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodObject<{
        specId: z.ZodString;
        repository: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specId: string;
        repository: string;
    }, {
        specId: string;
        repository: string;
    }>;
    createdAt: z.ZodString;
    contentDigest: z.ZodString;
    retentionPolicy: z.ZodOptional<z.ZodString>;
    purged: z.ZodBoolean;
    purgedAt: z.ZodOptional<z.ZodString>;
    artifactNames: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    spec: {
        specId: string;
        repository: string;
    };
    contentDigest: string;
    purged: boolean;
    artifactNames: string[];
    retentionPolicy?: string | undefined;
    purgedAt?: string | undefined;
}, {
    id: string;
    createdAt: string;
    spec: {
        specId: string;
        repository: string;
    };
    contentDigest: string;
    purged: boolean;
    artifactNames: string[];
    retentionPolicy?: string | undefined;
    purgedAt?: string | undefined;
}>;
export type TextExportSnapshot = z.infer<typeof TextExportSnapshotSchema>;
export declare const MetadataPatchSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    theme: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetRelease: z.ZodOptional<z.ZodString>;
    retentionPolicy: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        type: z.ZodEnum<[string, ...string[]]>;
        customDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        customDate?: string | undefined;
    }, {
        type: string;
        customDate?: string | undefined;
    }>, {
        type: string;
        customDate?: string | undefined;
    }, {
        type: string;
        customDate?: string | undefined;
    }>>;
    expectedRevision: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedRevision: number;
    summary?: string | undefined;
    theme?: string | undefined;
    tags?: string[] | undefined;
    owner?: string | undefined;
    targetRelease?: string | undefined;
    retentionPolicy?: {
        type: string;
        customDate?: string | undefined;
    } | undefined;
    title?: string | undefined;
}, {
    expectedRevision: number;
    summary?: string | undefined;
    theme?: string | undefined;
    tags?: string[] | undefined;
    owner?: string | undefined;
    targetRelease?: string | undefined;
    retentionPolicy?: {
        type: string;
        customDate?: string | undefined;
    } | undefined;
    title?: string | undefined;
}>;
export type MetadataPatch = z.infer<typeof MetadataPatchSchema>;
export declare const LocalSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"local">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "local";
}, {
    path: string;
    type: "local";
}>;
export declare const RemoteSourceSchema: z.ZodObject<{
    type: z.ZodLiteral<"remote">;
    url: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    webUrlTemplate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "remote";
    url: string;
    branch: string;
    webUrlTemplate?: string | undefined;
}, {
    type: "remote";
    url: string;
    branch?: string | undefined;
    webUrlTemplate?: string | undefined;
}>;
export declare const SourceConfigSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"local">;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "local";
}, {
    path: string;
    type: "local";
}>, z.ZodObject<{
    type: z.ZodLiteral<"remote">;
    url: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    webUrlTemplate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "remote";
    url: string;
    branch: string;
    webUrlTemplate?: string | undefined;
}, {
    type: "remote";
    url: string;
    branch?: string | undefined;
    webUrlTemplate?: string | undefined;
}>]>;
export type SourceConfig = z.infer<typeof SourceConfigSchema>;
export declare const CreateRelationshipSchema: z.ZodObject<{
    targetSpecKey: z.ZodString;
    type: z.ZodEnum<[string, ...string[]]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    targetSpecKey: string;
    note?: string | undefined;
}, {
    type: string;
    targetSpecKey: string;
    note?: string | undefined;
}>;
export type CreateRelationship = z.infer<typeof CreateRelationshipSchema>;
export declare const SpecFilterSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    stage: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    workflow: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    theme: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    metadataComplete: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    repository?: string | undefined;
    query?: string | undefined;
    stage?: string | undefined;
    workflow?: string | undefined;
    metadataComplete?: boolean | undefined;
}, {
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    repository?: string | undefined;
    query?: string | undefined;
    stage?: string | undefined;
    workflow?: string | undefined;
    metadataComplete?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type SpecFilter = z.infer<typeof SpecFilterSchema>;
export declare const ArchiveFilterSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    theme: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    retentionType: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    metadataComplete: z.ZodOptional<z.ZodBoolean>;
    afterDate: z.ZodOptional<z.ZodString>;
    beforeDate: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    repository?: string | undefined;
    query?: string | undefined;
    metadataComplete?: boolean | undefined;
    retentionType?: string | undefined;
    afterDate?: string | undefined;
    beforeDate?: string | undefined;
    cursor?: string | undefined;
}, {
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    repository?: string | undefined;
    query?: string | undefined;
    metadataComplete?: boolean | undefined;
    limit?: number | undefined;
    retentionType?: string | undefined;
    afterDate?: string | undefined;
    beforeDate?: string | undefined;
    cursor?: string | undefined;
}>;
export type ArchiveFilter = z.infer<typeof ArchiveFilterSchema>;
//# sourceMappingURL=schemas.d.ts.map