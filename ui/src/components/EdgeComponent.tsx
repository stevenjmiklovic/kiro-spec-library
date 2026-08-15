import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import type { ReactElement } from "react";

export interface SpecEdgeData extends Record<string, unknown> {
  relationshipType: string;
  pending?: boolean;
  selected?: boolean;
  parallelIndex?: number;
}

export type SpecEdgeType = Edge<SpecEdgeData, "spec">;

const PARALLEL_OFFSET_PX = 14;

/** Solid accepted edge or dashed pending-suggestion edge. */
export function SpecEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<SpecEdgeType>): ReactElement {
  const parallelIndex = data?.parallelIndex ?? 0;
  const offset = parallelIndex * PARALLEL_OFFSET_PX;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: sourceY + offset,
    targetX,
    targetY: targetY + offset,
    sourcePosition,
    targetPosition,
  });
  const pending = data?.pending === true;
  const selected = data?.selected === true;
  const relationshipType = data?.relationshipType ?? "related";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={`spec-edge ${pending ? "spec-edge--pending" : "spec-edge--accepted"}${selected ? " spec-edge--selected" : ""}`}
        style={{
          strokeDasharray: pending ? "6 4" : undefined,
          pointerEvents: "none",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`spec-edge-label${selected ? " spec-edge-label--selected" : ""}`}
          data-status={pending ? "pending" : "accepted"}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          aria-label={`${relationshipType} (${pending ? "suggested" : "accepted"})`}
        >
          {relationshipType}
          {pending ? " · suggested" : " · accepted"}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export { SpecEdge as EdgeComponent };
