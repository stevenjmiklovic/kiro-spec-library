import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Archive as ArchiveBox } from "@phosphor-icons/react/dist/csr/Archive";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";
import { Brain } from "@phosphor-icons/react/dist/csr/Brain";
import { CalendarBlank } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CirclesThree } from "@phosphor-icons/react/dist/csr/CirclesThree";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Code } from "@phosphor-icons/react/dist/csr/Code";
import { Copy } from "@phosphor-icons/react/dist/csr/Copy";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { File } from "@phosphor-icons/react/dist/csr/File";
import { FileCode } from "@phosphor-icons/react/dist/csr/FileCode";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { FunnelSimple } from "@phosphor-icons/react/dist/csr/FunnelSimple";
import { GearSix } from "@phosphor-icons/react/dist/csr/GearSix";
import { Ghost } from "@phosphor-icons/react/dist/csr/Ghost";
import { Graph } from "@phosphor-icons/react/dist/csr/Graph";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { Network } from "@phosphor-icons/react/dist/csr/Network";
import { NotePencil } from "@phosphor-icons/react/dist/csr/NotePencil";
import { Robot } from "@phosphor-icons/react/dist/csr/Robot";
import { Rows } from "@phosphor-icons/react/dist/csr/Rows";
import { SlidersHorizontal } from "@phosphor-icons/react/dist/csr/SlidersHorizontal";
import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { Stack } from "@phosphor-icons/react/dist/csr/Stack";
import { Target } from "@phosphor-icons/react/dist/csr/Target";
import { UsersThree } from "@phosphor-icons/react/dist/csr/UsersThree";
import { WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { X } from "@phosphor-icons/react/dist/csr/X";

const SPECS = {
  agent: {
    id: "agent",
    title: "Agent Memory v2",
    kind: "Feature Spec",
    stage: "Design",
    progress: 62,
    owner: "Maya Chen",
    initials: "MC",
    updated: "Aug 12, 2026",
    theme: "AI Foundations",
    tone: "violet",
    description:
      "Introduce persistent, user-scoped agent memory with versioned entries, retrieval APIs, and retention controls.",
    repo: "crew-platform",
    path: ".kiro/specs/agent-memory-v2",
    tags: ["agent", "memory", "api", "storage"],
    targetRelease: "Not set",
    artifacts: [
      ["Requirements", "Draft", 78],
      ["Design", "62%", 62],
      ["Tasks", "18%", 18],
    ],
    related: ["memory", "retention"],
  },
  alerts: {
    id: "alerts",
    title: "Usage anomaly alerts",
    kind: "Feature Spec",
    stage: "Requirements",
    progress: 28,
    owner: "Daniel Kim",
    initials: "DK",
    updated: "Aug 9, 2026",
    theme: "AI Foundations",
    tone: "violet",
    description:
      "Detect sustained usage deviations and route explainable alerts to the owning team.",
    repo: "usage-platform",
    path: ".kiro/specs/usage-anomaly-alerts",
    tags: ["usage", "alerts", "signals"],
    targetRelease: "Q4 2026",
    artifacts: [["Requirements", "28%", 28], ["Design", "Not started", 0], ["Tasks", "Not started", 0]],
    related: ["agent"],
  },
  oauth: {
    id: "oauth",
    title: "OAuth callback loop",
    kind: "Bugfix Spec",
    stage: "Tasks",
    progress: 75,
    owner: "Theo Grant",
    initials: "TG",
    updated: "Aug 10, 2026",
    theme: "AI Foundations",
    tone: "amber",
    description:
      "Remove a callback race that can return users to the authorization screen after successful login.",
    repo: "identity-service",
    path: ".kiro/specs/oauth-callback-loop",
    tags: ["oauth", "auth", "regression"],
    targetRelease: "August patch",
    artifacts: [["Bug analysis", "Complete", 100], ["Design", "Complete", 100], ["Tasks", "75%", 75]],
    related: ["agent"],
  },
  mcp: {
    id: "mcp",
    title: "MCP registry health",
    kind: "Bugfix Spec",
    stage: "Tasks",
    progress: 84,
    owner: "Lena Ortiz",
    initials: "LO",
    updated: "Aug 8, 2026",
    theme: "Platform Reliability",
    tone: "amber",
    description:
      "Surface stale registry entries and degraded MCP servers before tools become unavailable.",
    repo: "crew-platform",
    path: ".kiro/specs/mcp-registry-health",
    tags: ["mcp", "health", "registry"],
    targetRelease: "August patch",
    artifacts: [["Bug analysis", "Complete", 100], ["Design", "Complete", 100], ["Tasks", "84%", 84]],
    related: ["agent", "workspace"],
  },
  workspace: {
    id: "workspace",
    title: "Workspace semantic index",
    kind: "Quick Spec",
    stage: "Completed",
    progress: 100,
    owner: "Priya Shah",
    initials: "PS",
    updated: "Completed Aug 7",
    theme: "Platform Reliability",
    tone: "green",
    description:
      "Build a semantic index for workspace content to enable intelligent retrieval across specs, docs, and code.",
    repo: "crew-platform",
    path: ".kiro/specs/workspace-semantic-index",
    tags: ["search", "indexing", "semantic"],
    targetRelease: "Released",
    artifacts: [["Requirements", "Complete", 100], ["Design", "Complete", 100], ["Tasks", "Complete", 100]],
    related: ["mcp"],
  },
  memory: {
    id: "memory",
    title: "Agent Memory v1 migration",
    kind: "Feature Spec",
    stage: "Design",
    progress: 45,
    owner: "Priya Shah",
    initials: "PS",
    updated: "Aug 6, 2026",
    theme: "Developer Experience",
    tone: "violet",
    description:
      "Migrate legacy memory records into the versioned storage model without losing provenance.",
    repo: "crew-platform",
    path: ".kiro/specs/agent-memory-v1-migration",
    tags: ["migration", "memory", "compatibility"],
    targetRelease: "Q4 2026",
    artifacts: [["Requirements", "Complete", 100], ["Design", "45%", 45], ["Tasks", "Draft", 12]],
    related: ["agent"],
  },
  retention: {
    id: "retention",
    title: "Memory retention policies",
    kind: "Feature Spec",
    stage: "Requirements",
    progress: 30,
    owner: "Daniel Kim",
    initials: "DK",
    updated: "Aug 5, 2026",
    theme: "Developer Experience",
    tone: "blue",
    description:
      "Define project and user retention policies for durable agent memory and archive exports.",
    repo: "crew-platform",
    path: ".kiro/specs/memory-retention-policies",
    tags: ["memory", "retention", "governance"],
    targetRelease: "Not set",
    artifacts: [["Requirements", "30%", 30], ["Design", "Not started", 0], ["Tasks", "Not started", 0]],
    related: ["agent"],
  },
};

const ARCHIVE_ROWS = [
  { id: "workspace", title: "Workspace semantic index", kind: "Quick Spec", theme: "AI Foundations", repo: "crew-platform", owner: "Priya Shah", initials: "PS", date: "Aug 7, 2026", month: "August 2026", retention: "Retain 2 years" },
  { id: "billing", title: "Billing export v3", kind: "Feature Spec", theme: "Commerce", repo: "web-console", owner: "Lena Ortiz", initials: "LO", date: "Aug 3, 2026", month: "August 2026", retention: "Retain 2 years" },
  { id: "oauth", title: "OAuth callback loop", kind: "Bugfix Spec", theme: "Security", repo: "identity-service", owner: "Theo Grant", initials: "TG", date: "Jul 29, 2026", month: "July 2026", retention: "Needs metadata" },
  { id: "approval", title: "Agent tool approval audit", kind: "Feature Spec", theme: "Governance", repo: "crew-platform", owner: "Maya Chen", initials: "MC", date: "Jul 18, 2026", month: "July 2026", retention: "Retain 2 years" },
];

const GRAPH_LAYOUT = {
  alerts: { x: 120, y: 76 }, agent: { x: 355, y: 68 }, oauth: { x: 616, y: 80 },
  mcp: { x: 615, y: 345 }, workspace: { x: 850, y: 548 }, memory: { x: 120, y: 580 }, retention: { x: 355, y: 576 },
};
const GRAPH_EDGES = [["alerts", "agent"], ["memory", "agent"], ["retention", "agent"], ["agent", "oauth"], ["agent", "mcp"], ["mcp", "workspace"]];
const MAIN_NAV = [[House, "Dashboard"], [Robot, "Agents"], [Stack, "MCP Servers"], [SlidersHorizontal, "Jobs"], [ArchiveBox, "App Store"]];

function Avatar({ initials, small = false }) {
  return <span className={`avatar ${small ? "avatar--small" : ""}`}>{initials}</span>;
}

function Sidebar({ view, setView }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Ghost size={26} weight="fill" aria-hidden="true" />
        <div><img src="/assets/kiro-wordmark.png" alt="Kiro" /><span>CREW</span></div>
      </div>
      <nav aria-label="Crew navigation">
        <p className="nav-label">CREW</p>
        {MAIN_NAV.map(([Icon, label]) => <button className="nav-item" key={label} type="button"><Icon size={18} /><span>{label}</span></button>)}
        <div className="nav-divider" />
        <p className="nav-label">KNOWLEDGE</p>
        <div className="nav-item nav-parent"><FileCode size={18} /><span>Specs</span><CaretDown size={14} /></div>
        <div className="subnav">
          <button className={view === "relationship" ? "active" : ""} onClick={() => setView("relationship")} type="button"><Graph size={17} />Relationship</button>
          <button className={view === "archive" ? "active" : ""} onClick={() => setView("archive")} type="button"><ClockCounterClockwise size={17} />Archive</button>
        </div>
        <button className="nav-item" type="button"><CirclesThree size={18} /><span>Collections</span></button>
        <button className="nav-item" type="button"><Folder size={18} /><span>Context</span><CaretDown size={14} /></button>
        <div className="nav-divider" />
        <p className="nav-label">SETTINGS</p>
        <button className="nav-item" type="button"><UsersThree size={18} /><span>Team</span></button>
        <button className="nav-item" type="button"><Network size={18} /><span>Integrations</span></button>
        <button className="nav-item" type="button"><GearSix size={18} /><span>Preferences</span></button>
      </nav>
      <div className="sidebar-footer">
        <div className="workspace-picker"><Target size={18} /><div><strong>Spec Observatory</strong><span>crew-platform</span></div><CaretDown size={14} /></div>
        <div className="profile"><Avatar initials="MC" /><div><strong>Maya Chen</strong><span>View profile</span></div></div>
      </div>
    </aside>
  );
}

function SpecNode({ data, selected }) {
  const spec = data.spec;
  const ToneIcon = spec.kind === "Bugfix Spec" ? WarningCircle : spec.stage === "Completed" ? CheckCircle : Target;
  return (
    <div className={`spec-node spec-node--${spec.tone} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="spec-node__title"><ToneIcon size={16} weight="fill" /><strong>{spec.title}</strong></div>
      <span>{spec.kind}</span>
      <small>{spec.stage === "Completed" ? spec.updated : `${spec.progress}% · ${spec.owner}`}</small>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const NODE_TYPES = { spec: SpecNode };

function SearchBar({ value, onChange, light = false }) {
  return <label className={`search ${light ? "search--light" : ""}`}><MagnifyingGlass size={18} /><input aria-label="Search specs" onChange={(event) => onChange(event.target.value)} placeholder="Search specs, themes, owners, or tags…" value={value} /><kbd>⌘ K</kbd></label>;
}

function ScopeToggle({ scope, setScope }) {
  return <div className="segmented" aria-label="Spec scope"><button className={scope === "team" ? "active" : ""} onClick={() => setScope("team")} type="button">Team</button><button className={scope === "mine" ? "active" : ""} onClick={() => setScope("mine")} type="button">Mine</button></div>;
}

function DetailPanel({ spec, onMetadata, onOpen, onClose }) {
  const related = spec.related.map((id) => SPECS[id]).filter(Boolean);
  return (
    <aside className="detail-panel" aria-label={`${spec.title} details`}>
      <div className="detail-heading"><div><Target size={24} weight="duotone" /><h2>{spec.title}</h2></div><button aria-label="Close details" onClick={onClose} type="button"><X size={18} /></button></div>
      <p className="detail-kicker">{spec.kind} <span>•</span> {spec.stage} <span>•</span> {spec.progress}%</p>
      <div className="owner-line"><Avatar initials={spec.initials} small /><span>{spec.owner}</span></div>
      <p className="updated">Updated {spec.updated.replace("Completed ", "")}</p>
      <p className="description">{spec.description}</p>
      <section><h3>ARTIFACT STATE</h3><div className="artifact-list">{spec.artifacts.map(([name, status, progress]) => <div className="artifact" key={name}><span>{progress === 100 ? <CheckCircle size={17} /> : <File size={17} />}{name}</span><div><progress max="100" value={progress} /><strong className={progress < 1 ? "muted" : ""}>{status}</strong></div></div>)}</div></section>
      <section><h3>SOURCE</h3><dl className="source-list"><div><dt>Repository</dt><dd>{spec.repo}</dd></div><div><dt>Path</dt><dd>{spec.path} <Copy size={15} /></dd></div></dl></section>
      <section><h3>TAGS</h3><div className="tags">{spec.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></section>
      {related.length > 0 && <section className="related"><h3>RELATED SPECS</h3>{related.map((item) => <button key={item.id} type="button"><span className={`relation-mark relation-mark--${item.tone}`} /><span><strong>{item.title}</strong><small>{item.stage} · {item.progress}% · {item.owner}</small></span><ArrowSquareOut size={16} /></button>)}</section>}
      <section className="metadata-warning"><h3>METADATA</h3><div><span>Target release</span><strong className={spec.targetRelease === "Not set" ? "warning" : ""}>{spec.targetRelease === "Not set" && <WarningCircle size={17} />}{spec.targetRelease}</strong></div></section>
      <div className="detail-actions"><button className="primary-button" onClick={() => onOpen(spec)} type="button">Open Spec <ArrowSquareOut size={17} /></button><button className="secondary-button" onClick={() => onMetadata(spec)} type="button"><NotePencil size={17} /> Review metadata</button></div>
    </aside>
  );
}

function RelationshipView({ onOpen, onMetadata }) {
  const [selectedId, setSelectedId] = useState("agent");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("team");
  const [theme, setTheme] = useState("All themes");
  const selected = SPECS[selectedId] || SPECS.agent;
  const matches = useCallback((spec) => {
    const query = search.trim().toLowerCase();
    const searchable = [spec.title, spec.owner, spec.kind, spec.theme, spec.repo, ...spec.tags].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (scope === "team" || spec.owner === "Maya Chen") && (theme === "All themes" || spec.theme === theme);
  }, [scope, search, theme]);
  const nodes = useMemo(() => Object.values(SPECS).map((spec) => ({ id: spec.id, type: "spec", position: GRAPH_LAYOUT[spec.id], data: { spec }, hidden: !matches(spec), selected: selectedId === spec.id })), [matches, selectedId]);
  const edges = useMemo(() => GRAPH_EDGES.map(([source, target], index) => ({ id: `edge-${index}`, source, target, type: "smoothstep", animated: selectedId === source || selectedId === target, style: { stroke: selectedId === source || selectedId === target ? "#9c75ff" : "#555362", strokeWidth: selectedId === source || selectedId === target ? 2 : 1.25 } })), [selectedId]);
  return (
    <main className="relationship-view">
      <header className="relationship-header">
        <h1>Spec Library</h1><SearchBar onChange={setSearch} value={search} />
        <div className="header-tools"><span className="today"><CalendarBlank size={18} /> Aug 12, 2026</span><ScopeToggle scope={scope} setScope={setScope} /><label className="theme-select"><span className="sr-only">Filter by theme</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option>All themes</option><option>AI Foundations</option><option>Platform Reliability</option><option>Developer Experience</option></select><CaretDown size={15} /></label><button className="icon-button" aria-label="More filters" type="button"><SlidersHorizontal size={19} /></button></div>
      </header>
      <div className={`workspace ${selectedId ? "has-detail" : ""}`}>
        <section className={`graph-shell ${selectedId ? "has-detail" : ""}`} aria-label="Spec relationships">
          <div className="stage-legend" aria-hidden="true"><span className="violet"><File size={19} /> Requirements</span><span className="violet"><NotePencil size={19} /> Design</span><span className="blue"><Rows size={19} /> Tasks</span><span className="green"><CheckCircle size={19} /> Completed</span></div>
          <div className="theme-labels" aria-hidden="true"><div><Brain size={29} weight="duotone" /><strong>AI Foundations</strong><span>4 specs</span></div><div><Database size={29} weight="duotone" /><strong>Platform Reliability</strong><span>3 specs</span></div><div><Code size={29} weight="duotone" /><strong>Developer Experience</strong><span>5 specs</span></div></div>
          <ReactFlow colorMode="dark" edges={edges} fitView fitViewOptions={{ padding: 0.12 }} maxZoom={1.35} minZoom={0.58} nodeTypes={NODE_TYPES} nodes={nodes} nodesConnectable={false} nodesDraggable={false} onNodeClick={(_, node) => setSelectedId(node.id)} proOptions={{ hideAttribution: true }}><Background color="#34323d" gap={26} size={1} /><Controls position="bottom-left" showInteractive={false} /></ReactFlow>
          <div className="graph-legend" aria-hidden="true"><span><i className="violet" /> Feature Spec</span><span><i className="amber" /> Bugfix Spec</span><span><i className="blue" /> Quick Spec</span><span><i className="green" /> Completed</span></div>
          {!nodes.some((node) => !node.hidden) && <div className="empty-state"><MagnifyingGlass size={28} /><strong>No specs match this view</strong><span>Try a different owner, theme, or search.</span></div>}
        </section>
        {selectedId && <DetailPanel onClose={() => setSelectedId(null)} onMetadata={onMetadata} onOpen={onOpen} spec={selected} />}
      </div>
    </main>
  );
}

function ArchiveDetail({ row, onOpen, onMetadata }) {
  const spec = SPECS[row.id] || { ...SPECS.workspace, ...row, tags: ["commerce", "export", "audit"], path: `.kiro/specs/${row.title.toLowerCase().replaceAll(" ", "-")}` };
  return (
    <section className="archive-detail">
      <div className="archive-detail__intro"><span className="archive-file"><FileCode size={26} /></span><div><div className="archive-detail__title"><h2>{row.title}</h2><span>Completed</span></div><p>{spec.description}</p><div className="archive-tags">{(spec.tags || ["archive", "spec"]).map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
      <div className="archive-detail__actions"><button className="archive-primary" onClick={() => onOpen(spec)} type="button">Open Spec <ArrowSquareOut size={16} /></button><button className="archive-secondary" onClick={() => onMetadata(spec)} type="button"><NotePencil size={16} /> Edit metadata</button></div>
      <div className="archive-columns">
        <section><h3>ARTIFACT COMPLETENESS</h3>{spec.artifacts?.map(([name]) => <div className="archive-fact artifact-fact" key={name}><span>{name}</span><strong><CheckCircle size={15} /> Complete</strong><progress max="100" value="100" /></div>)}</section>
        <section><h3>SOURCE</h3><div className="archive-fact"><span>Repository</span><strong>{row.repo}</strong></div><div className="archive-fact"><span>Path</span><strong>{spec.path}</strong></div><div className="archive-fact"><span>Branch</span><strong>main</strong></div><div className="archive-fact"><span>Commit</span><strong>a1b2c3d4e5f6</strong></div></section>
        <section><h3>PROVENANCE</h3><div className="archive-fact"><span>Archived by</span><strong>{row.owner}</strong></div><div className="archive-fact"><span>Archived on</span><strong>{row.date}, 10:14 AM</strong></div><div className="archive-fact"><span>Spec ID</span><strong>spec_01K3Z8Q9X7</strong></div><div className="archive-fact"><span>Source run</span><strong>run_01K1A2BC3D</strong></div></section>
        <section><h3>RETENTION</h3><div className="archive-fact"><span>Policy</span><strong>{row.retention}</strong></div><div className="archive-fact"><span>Eligible for purge</span><strong>Aug 7, 2028</strong></div><div className="archive-fact"><span>Legal hold</span><strong>—</strong></div></section>
      </div>
    </section>
  );
}

function ArchiveView({ onOpen, onMetadata }) {
  const [selectedId, setSelectedId] = useState("workspace");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("team");
  const selected = ARCHIVE_ROWS.find((row) => row.id === selectedId) || ARCHIVE_ROWS[0];
  const filtered = ARCHIVE_ROWS.filter((row) => { const query = search.toLowerCase(); const text = Object.values(row).join(" ").toLowerCase(); return (!query || text.includes(query)) && (scope === "team" || row.owner === "Maya Chen"); });
  return (
    <main className="archive-view">
      <header className="archive-header"><div><h1>Spec Library</h1><p>Browse, retrieve, and curate completed Kiro Specs.</p></div><span>Updated Aug 12, 2026, 9:41 AM</span></header>
      <div className="archive-tools"><SearchBar light onChange={setSearch} value={search} /><ScopeToggle scope={scope} setScope={setScope} /><button type="button"><ArchiveBox size={17} /> Completed <CaretDown size={14} /></button><button type="button"><FunnelSimple size={17} /> Filters</button></div>
      <section className="archive-table" aria-label="Completed specs"><div className="archive-row archive-row--head"><span>Spec name</span><span>Type</span><span>Theme</span><span>Repository</span><span>Owner</span><span>Completed</span><span>Retention</span></div>{["August 2026", "July 2026"].map((month) => <div className="archive-month" key={month}><h2>{month}</h2>{filtered.filter((row) => row.month === month).map((row) => <button className={`archive-row ${selectedId === row.id ? "is-selected" : ""}`} key={row.id} onClick={() => setSelectedId(row.id)} type="button"><span><FileCode size={18} /><strong>{row.title}</strong></span><span>{row.kind}</span><span>{row.theme}</span><span>{row.repo}</span><span><Avatar initials={row.initials} small /> {row.owner}</span><span>{row.date}</span><span className={row.retention === "Needs metadata" ? "needs-metadata" : ""}>{row.retention === "Needs metadata" && <WarningCircle size={16} />}{row.retention}</span></button>)}</div>)}{filtered.length === 0 && <div className="archive-empty">No archived specs match your search.</div>}</section>
      <div className="month-index" aria-hidden="true"><strong>2026</strong>{["Aug", "Jul", "Jun", "May", "Apr", "Mar", "Feb", "Jan"].map((month, index) => <span className={index === 0 ? "active" : ""} key={month}>{month}</span>)}<strong>2025</strong></div>
      <ArchiveDetail onMetadata={onMetadata} onOpen={onOpen} row={selected} />
    </main>
  );
}

function MetadataDialog({ spec, onClose, onSave }) {
  const [release, setRelease] = useState(spec.targetRelease === "Not set" ? "Q4 2026" : spec.targetRelease);
  const [tags, setTags] = useState(spec.tags.join(", "));
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section aria-labelledby="metadata-title" aria-modal="true" className="metadata-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog"><header><div><span><Sparkle size={18} /></span><div><p>METADATA REVIEW</p><h2 id="metadata-title">{spec.title}</h2></div></div><button aria-label="Close metadata dialog" onClick={onClose} type="button"><X size={18} /></button></header><p className="dialog-copy">Complete the retrieval fields that help your team find and maintain this Spec.</p><label>Target release<input value={release} onChange={(event) => setRelease(event.target.value)} /></label><label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} /><small>Separate tags with commas.</small></label><label>Retention policy<select defaultValue="active-plus-two-years"><option value="active-plus-two-years">Active + 2 years</option><option>Permanent</option><option>Project lifetime</option></select></label><footer><button className="secondary-button" onClick={onClose} type="button">Cancel</button><button className="primary-button" onClick={() => onSave({ release, tags })} type="button">Save metadata</button></footer></section></div>;
}

function Toast({ message }) { return message ? <div className="toast" role="status"><Check size={17} weight="bold" /> {message}</div> : null; }

export function App() {
  const [view, setView] = useState("relationship");
  const [metadataSpec, setMetadataSpec] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  return <div className={`app-shell app-shell--${view}`}><Sidebar setView={setView} view={view} />{view === "relationship" ? <RelationshipView onMetadata={setMetadataSpec} onOpen={(spec) => showToast(`${spec.title} opened in a new Spec session.`)} /> : <ArchiveView onMetadata={setMetadataSpec} onOpen={(spec) => showToast(`${spec.title} opened from the Archive.`)} />}{metadataSpec && <MetadataDialog onClose={() => setMetadataSpec(null)} onSave={() => { setMetadataSpec(null); showToast("Metadata saved to the library index."); }} spec={metadataSpec} />}<Toast message={toast} /></div>;
}
