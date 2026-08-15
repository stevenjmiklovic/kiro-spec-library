import { type NodeProps, type Node } from '@xyflow/react';
export type SpecType = 'feature' | 'bugfix' | 'quick' | 'unknown';
export interface SpecNodeData {
    id: string;
    title: string;
    type: SpecType;
    stage: string;
    progress: number;
    owner: string;
    theme: string;
    selected?: boolean;
    superseded?: boolean;
    onSelect?: (id: string) => void;
    [key: string]: unknown;
}
/** React Flow node type carrying SpecNodeData. */
export type SpecNodeType = Node<SpecNodeData>;
export declare function SpecNode({ data }: NodeProps<SpecNodeType>): import("react/jsx-runtime").JSX.Element;
/** Alias for consumers that import as `NodeComponent`. */
export { SpecNode as NodeComponent };
//# sourceMappingURL=NodeComponent.d.ts.map