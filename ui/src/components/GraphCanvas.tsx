import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, type MouseEvent, type ReactElement } from "react";
import { NodeComponent, type SpecNodeData, type SpecType } from "./NodeComponent.js";
import { EdgeComponent, type SpecEdgeData } from "./EdgeComponent.js";

export interface GraphSpec {
  key: string;
  title: string;
  type: SpecType;
  stage: string;
  progress: number;
  owner: string;
  theme: string;
  repository?: string;
  reviewed?: boolean;
  relationships?: Array<{ targetKey: string; type: string }>;
  suggestions?: Array<{ targetKey: string; type: string }>;
}

/** Available Y-axis grouping fields. */
export type YAxisField = "theme" | "owner" | "repository" | "type";
export const Y_AXIS_OPTIONS: { value: YAxisField; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "repository", label: "Repository" },
  { value: "type", label: "Type" },
  { value: "theme", label: "Theme" },
];

const STAGES = ["new", "scoped", "refined", "in-flight", "done"];

/** Human-readable column headers for the X-axis (workflow progression). */
const STAGE_LABELS: Record<string, string> = {
  "new": "New",
  "scoped": "Scoped",
  "refined": "Refined",
  "in-flight": "In-Flight",
  "done": "Done",
};

const LEFT_GUTTER = 160;
const STAGE_WIDTH = 270;
const LANE_GAP = 220;
const NODE_GAP = 138;

const nodeTypes = { spec: NodeComponent };
const edgeTypes = { spec: EdgeComponent };

/** Extract the lane value for a spec given the chosen Y-axis field. */
function getLaneValue(spec: GraphSpec, field: YAxisField): string {
  switch (field) {
    case "owner": return spec.owner || "Unassigned";
    case "repository": return spec.repository || "Unassigned";
    case "type": return spec.type || "unknown";
    case "theme": return spec.theme || "Unassigned";
  }
}

/** Place every node deterministically by yAxisField lane, stage column, title, then spec key. */
export function placeGraphNodes(specs: GraphSpec[], yAxisField: YAxisField = "theme"): Node<SpecNodeData>[] {
  const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
  const nodes: Node<SpecNodeData>[] = [];

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
            reviewed: spec.reviewed ?? false,
          },
        });
      });
    }
  }
  return nodes;
}

/** Build accepted (solid) and proposed (dashed) edges with stable pair offsets. */
export function buildGraphEdges(specs: GraphSpec[], selectedKey?: string): Edge[] {
  const existing = new Set(specs.map((spec) => spec.key));
  const pairCounts = new Map<string, number>();
  const edges: Edge[] = [];
  const nextParallelIndex = (a: string, b: string) => {
    const pair = [a, b].sort().join("::");
    const current = pairCounts.get(pair) ?? 0;
    pairCounts.set(pair, current + 1);
    return current;
  };

  for (const source of specs) {
    for (const rel of source.relationships ?? []) {
      if (!existing.has(rel.targetKey)) continue;
      const selected = source.key === selectedKey || rel.targetKey === selectedKey;
      const data: SpecEdgeData = {
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
      if (!existing.has(suggestion.targetKey)) continue;
      const selected = source.key === selectedKey || suggestion.targetKey === selectedKey;
      const data: SpecEdgeData = {
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

function GraphLegend(): ReactElement {
  return <div className="graph-legend" aria-label="Relationship legend"><span><i className="graph-legend__solid" />Accepted relationship</span><span><i className="graph-legend__dashed" />Pending suggestion</span></div>;
}

function GraphOverlays({ specs, yAxisField }: { specs: GraphSpec[]; yAxisField: YAxisField }): ReactElement {
  const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
  return <>
    <div className="graph-stage-header" aria-hidden="true">
      {STAGES.map((stage) => <span key={stage}>{STAGE_LABELS[stage] ?? stage}</span>)}
    </div>
    <div className="graph-lane-gutter" aria-hidden="true">
      {lanes.map((lane) => <span key={lane}>{lane}</span>)}
    </div>
  </>;
}

export interface GraphCanvasProps {
  specs: GraphSpec[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  colorMode?: "light" | "dark";
  yAxisField?: YAxisField;
}

function GraphCanvasInner({ specs, selectedKey, onSelect, colorMode = "dark", yAxisField = "theme" }: GraphCanvasProps): ReactElement {
  // Compute which specs are superseded (targets of a 'supersedes' relationship).
  const supersededKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const spec of specs) {
      for (const rel of spec.relationships ?? []) {
        if (rel.type === 'supersedes') keys.add(rel.targetKey);
      }
    }
    return keys;
  }, [specs]);

  const nodes = useMemo(() => placeGraphNodes(specs, yAxisField).map((node) => ({ ...node, data: { ...node.data, selected: node.id === selectedKey, superseded: supersededKeys.has(node.id), onSelect } })), [specs, selectedKey, onSelect, supersededKeys, yAxisField]);
  const edges = useMemo(() => buildGraphEdges(specs, selectedKey), [specs, selectedKey]);
  const handleNodeClick = useCallback((_event: MouseEvent, node: Node) => onSelect?.(node.id), [onSelect]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInit = useCallback((instance: any) => {
    instance.fitView({ padding: 0.15 });
  }, []);

  return <div className="graph-canvas-container"><GraphOverlays specs={specs} yAxisField={yAxisField} /><div className="graph-viewport"><ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    colorMode={colorMode}
    onNodeClick={handleNodeClick}
    onInit={handleInit}
    minZoom={0.25}
    maxZoom={4}
    nodesDraggable={false}
    nodesConnectable={false}
    fitView
    fitViewOptions={{ padding: 0.15 }}
  ><Background color={colorMode === "dark" ? "#34323d" : "#d0d0d8"} gap={26} size={1} /><Controls showInteractive={false} /></ReactFlow></div><GraphLegend /></div>;
}

export default function GraphCanvas(props: GraphCanvasProps): ReactElement {
  return <ReactFlowProvider><GraphCanvasInner {...props} /></ReactFlowProvider>;
}
