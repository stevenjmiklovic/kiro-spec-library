import { type Edge, type EdgeProps } from "@xyflow/react";
import type { ReactElement } from "react";
export interface SpecEdgeData extends Record<string, unknown> {
    relationshipType: string;
    pending?: boolean;
    selected?: boolean;
    parallelIndex?: number;
}
export type SpecEdgeType = Edge<SpecEdgeData, "spec">;
/** Solid accepted edge or dashed pending-suggestion edge. */
export declare function SpecEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, }: EdgeProps<SpecEdgeType>): ReactElement;
export { SpecEdge as EdgeComponent };
//# sourceMappingURL=EdgeComponent.d.ts.map