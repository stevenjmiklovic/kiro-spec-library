import { type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type ReactElement } from "react";
import { type SpecNodeData, type SpecType } from "./NodeComponent.js";
export interface GraphSpec {
    key: string;
    title: string;
    type: SpecType;
    stage: string;
    progress: number;
    owner: string;
    theme: string;
    repository?: string;
    /** Friendly project/source name (derived backend-side from the source config). */
    project?: string;
    reviewed?: boolean;
    /** ISO 8601 — last indexed/scanned time. Drives the "Chronological" X-axis. */
    indexedAt?: string;
    relationships?: Array<{
        targetKey: string;
        type: string;
    }>;
    suggestions?: Array<{
        targetKey: string;
        type: string;
    }>;
}
/** Available Y-axis grouping fields. */
export type YAxisField = "project" | "theme" | "owner" | "repository" | "type";
export declare const Y_AXIS_OPTIONS: {
    value: YAxisField;
    label: string;
}[];
/** Available X-axis grouping modes. */
export type XAxisField = "status" | "chronological";
export declare const X_AXIS_OPTIONS: {
    value: XAxisField;
    label: string;
}[];
/** Place every node deterministically by yAxisField lane, xAxisField column, title, then spec key. */
export declare function placeGraphNodes(specs: GraphSpec[], yAxisField?: YAxisField, xAxisField?: XAxisField): Node<SpecNodeData>[];
/** Build accepted (solid) and proposed (dashed) edges with stable pair offsets. */
export declare function buildGraphEdges(specs: GraphSpec[], selectedKey?: string): Edge[];
export interface GraphCanvasProps {
    specs: GraphSpec[];
    selectedKey?: string;
    onSelect?: (key: string) => void;
    colorMode?: "light" | "dark";
    yAxisField?: YAxisField;
    xAxisField?: XAxisField;
}
export default function GraphCanvas(props: GraphCanvasProps): ReactElement;
//# sourceMappingURL=GraphCanvas.d.ts.map