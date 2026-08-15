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
    query?: string | undefined;
    stage?: string | undefined;
    workflow?: string | undefined;
    repository?: string | undefined;
    metadataComplete?: boolean | undefined;
}, {
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    query?: string | undefined;
    stage?: string | undefined;
    workflow?: string | undefined;
    repository?: string | undefined;
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
    query?: string | undefined;
    repository?: string | undefined;
    metadataComplete?: boolean | undefined;
    retentionType?: string | undefined;
    afterDate?: string | undefined;
    beforeDate?: string | undefined;
    cursor?: string | undefined;
}, {
    type?: string | undefined;
    theme?: string | undefined;
    owner?: string | undefined;
    query?: string | undefined;
    repository?: string | undefined;
    metadataComplete?: boolean | undefined;
    limit?: number | undefined;
    retentionType?: string | undefined;
    afterDate?: string | undefined;
    beforeDate?: string | undefined;
    cursor?: string | undefined;
}>;
export type ArchiveFilter = z.infer<typeof ArchiveFilterSchema>;
//# sourceMappingURL=schemas.d.ts.map