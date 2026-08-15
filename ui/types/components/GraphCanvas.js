import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Background, Controls, ReactFlow, ReactFlowProvider, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import { NodeComponent } from "./NodeComponent.js";
import { EdgeComponent } from "./EdgeComponent.js";
export const Y_AXIS_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "repository", label: "Repository" },
    { value: "type", label: "Type" },
    { value: "theme", label: "Theme" },
];
const STAGES = ["requirements", "bug_analysis", "design", "tasks", "completed"];
/** Human-readable column headers for the X-axis (workflow progression). */
const STAGE_LABELS = {
    requirements: "Scoping",
    bug_analysis: "Analysis",
    design: "Design",
    tasks: "Implementation",
    completed: "Done",
};
const LEFT_GUTTER = 160;
const STAGE_WIDTH = 270;
const LANE_GAP = 220;
const NODE_GAP = 138;
const nodeTypes = { spec: NodeComponent };
const edgeTypes = { spec: EdgeComponent };
/** Extract the lane value for a spec given the chosen Y-axis field. */
function getLaneValue(spec, field) {
    switch (field) {
        case "owner": return spec.owner || "Unassigned";
        case "repository": return spec.repository || "Unassigned";
        case "type": return spec.type || "unknown";
        case "theme": return spec.theme || "Unassigned";
    }
}
/** Place every node deterministically by yAxisField lane, stage column, title, then spec key. */
export function placeGraphNodes(specs, yAxisField = "theme") {
    const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
    const nodes = [];
    for (const lane of lanes) {
        const laneIndex = lanes.indexOf(lane);
        for (const stage of STAGES) {
            const inCell = specs
                .filter((spec) => getLaneValue(spec, yAxisField) === lane && spec.stage === stage)
                .sort((a, b) => a.title.localeCompare(b.title) || a.key.localeCompare(b.key));
            inCell.forEach((spec, rowIndex) => {
                nodes.push({
                    id: spec.key,
                    type: "spec",
                    position: { x: LEFT_GUTTER + STAGES.indexOf(stage) * STAGE_WIDTH, y: laneIndex * LANE_GAP + rowIndex * NODE_GAP },
                    draggable: false,
                    connectable: false,
                    data: {
                        id: spec.key,
                        title: spec.title,
                        type: spec.type,
                        stage: spec.stage,
                        progress: spec.progress,
                        owner: spec.owner,
                        theme: spec.theme || "Unassigned",
                    },
                });
            });
        }
    }
    return nodes;
}
/** Build accepted (solid) and proposed (dashed) edges with stable pair offsets. */
export function buildGraphEdges(specs, selectedKey) {
    const existing = new Set(specs.map((spec) => spec.key));
    const pairCounts = new Map();
    const edges = [];
    const nextParallelIndex = (a, b) => {
        const pair = [a, b].sort().join("::");
        const current = pairCounts.get(pair) ?? 0;
        pairCounts.set(pair, current + 1);
        return current;
    };
    for (const source of specs) {
        for (const rel of source.relationships ?? []) {
            if (!existing.has(rel.targetKey))
                continue;
            const selected = source.key === selectedKey || rel.targetKey === selectedKey;
            const data = {
                relationshipType: rel.type,
                pending: false,
                selected,
                parallelIndex: nextParallelIndex(source.key, rel.targetKey),
            };
            edges.push({
                id: `relationship:${source.key}:${rel.targetKey}:${rel.type}:${data.parallelIndex}`,
                source: source.key,
                target: rel.targetKey,
                type: "spec",
                animated: selected,
                data,
            });
        }
        for (const suggestion of source.suggestions ?? []) {
            if (!existing.has(suggestion.targetKey))
                continue;
            const selected = source.key === selectedKey || suggestion.targetKey === selectedKey;
            const data = {
                relationshipType: suggestion.type,
                pending: true,
                selected,
                parallelIndex: nextParallelIndex(source.key, suggestion.targetKey),
            };
            edges.push({
                id: `suggestion:${source.key}:${suggestion.targetKey}:${suggestion.type}:${data.parallelIndex}`,
                source: source.key,
                target: suggestion.targetKey,
                type: "spec",
                animated: selected,
                data,
            });
        }
    }
    return edges;
}
function GraphLegend() {
    return _jsxs("div", { className: "graph-legend", "aria-label": "Relationship legend", children: [_jsxs("span", { children: [_jsx("i", { className: "graph-legend__solid" }), "Accepted relationship"] }), _jsxs("span", { children: [_jsx("i", { className: "graph-legend__dashed" }), "Pending suggestion"] })] });
}
function GraphOverlays({ specs, yAxisField }) {
    const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
    return _jsxs(_Fragment, { children: [_jsx("div", { className: "graph-stage-header", "aria-hidden": "true", children: STAGES.map((stage) => _jsx("span", { children: STAGE_LABELS[stage] ?? stage }, stage)) }), _jsx("div", { className: "graph-lane-gutter", "aria-hidden": "true", children: lanes.map((lane) => _jsx("span", { children: lane }, lane)) })] });
}
function GraphCanvasInner({ specs, selectedKey, onSelect, colorMode = "dark", yAxisField = "theme" }) {
    // Compute which specs are superseded (targets of a 'supersedes' relationship).
    const supersededKeys = useMemo(() => {
        const keys = new Set();
        for (const spec of specs) {
            for (const rel of spec.relationships ?? []) {
                if (rel.type === 'supersedes')
                    keys.add(rel.targetKey);
            }
        }
        return keys;
    }, [specs]);
    const nodes = useMemo(() => placeGraphNodes(specs, yAxisField).map((node) => ({ ...node, data: { ...node.data, selected: node.id === selectedKey, superseded: supersededKeys.has(node.id), onSelect } })), [specs, selectedKey, onSelect, supersededKeys, yAxisField]);
    const edges = useMemo(() => buildGraphEdges(specs, selectedKey), [specs, selectedKey]);
    const handleNodeClick = useCallback((_event, node) => onSelect?.(node.id), [onSelect]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInit = useCallback((instance) => {
        instance.fitView({ padding: 0.15 });
    }, []);
    return _jsxs("div", { className: "graph-canvas-container", children: [_jsx(GraphOverlays, { specs: specs, yAxisField: yAxisField }), _jsx("div", { className: "graph-viewport", children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, nodeTypes: nodeTypes, edgeTypes: edgeTypes, colorMode: colorMode, onNodeClick: handleNodeClick, onInit: handleInit, minZoom: 0.25, maxZoom: 4, nodesDraggable: false, nodesConnectable: false, fitView: true, fitViewOptions: { padding: 0.15 }, children: [_jsx(Background, { color: colorMode === "dark" ? "#34323d" : "#d0d0d8", gap: 26, size: 1 }), _jsx(Controls, { showInteractive: false })] }) }), _jsx(GraphLegend, {})] });
}
export default function GraphCanvas(props) {
    return _jsx(ReactFlowProvider, { children: _jsx(GraphCanvasInner, { ...props }) });
}
