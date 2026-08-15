import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, } from "@xyflow/react";
const PARALLEL_OFFSET_PX = 14;
/** Solid accepted edge or dashed pending-suggestion edge. */
export function SpecEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, }) {
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
    return (_jsxs(_Fragment, { children: [_jsx(BaseEdge, { id: id, path: edgePath, markerEnd: markerEnd, className: `spec-edge ${pending ? "spec-edge--pending" : "spec-edge--accepted"}${selected ? " spec-edge--selected" : ""}`, style: {
                    strokeDasharray: pending ? "6 4" : undefined,
                    pointerEvents: "none",
                } }), _jsx(EdgeLabelRenderer, { children: _jsxs("div", { className: `spec-edge-label${selected ? " spec-edge-label--selected" : ""}`, "data-status": pending ? "pending" : "accepted", style: {
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                    }, "aria-label": `${relationshipType} (${pending ? "suggested" : "accepted"})`, children: [relationshipType, pending ? " · suggested" : " · accepted"] }) })] }));
}
export { SpecEdge as EdgeComponent };
