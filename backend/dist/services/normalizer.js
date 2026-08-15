import { createHash } from 'node:crypto';
export function deriveKey(sourceId, specId, relativePath) {
    if (specId) {
        return `${sourceId}::${specId}`;
    }
    return `${sourceId}::${relativePath}`;
}
export function classifyType(artifacts, config) {
    if (config?.specType === 'bugfix' || (artifacts['bugfix.md'] && !artifacts['requirements.md'])) {
        return 'bugfix';
    }
    if (artifacts['requirements.md'] && artifacts['design.md']) {
        return 'feature';
    }
    if (artifacts['tasks.md'] && !artifacts['design.md'] && !artifacts['requirements.md']) {
        return 'quick';
    }
    return 'unknown';
}
export function classifyWorkflow(artifacts) {
    if (artifacts['requirements.md']) {
        return 'requirements-first';
    }
    if (artifacts['design.md'] && !artifacts['requirements.md']) {
        return 'design-first';
    }
    return 'unknown';
}
export function extractTitle(content, fallbackSlug) {
    if (content) {
        const match = content.match(/^#\s+(.+)$/m);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return fallbackSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
export function calculateStage(artifacts, taskCounts) {
    if (artifacts['tasks.md'] && taskCounts.total > 0 && taskCounts.completed === taskCounts.total) {
        return 'completed';
    }
    if (artifacts['tasks.md']) {
        return 'tasks';
    }
    if (artifacts['design.md']) {
        return 'design';
    }
    if (artifacts['bugfix.md'] && !artifacts['requirements.md']) {
        return 'bug_analysis';
    }
    return 'requirements';
}
export function calculateProgress(artifacts, taskCounts) {
    let base = 0;
    // Check for initial artifact (requirements or bugfix)
    if (artifacts["requirements.md"] || artifacts["bugfix.md"]) {
        base += 33;
    }
    if (artifacts["design.md"]) {
        base += 33;
    }
    if (artifacts["tasks.md"] && taskCounts.total > 0) {
        base += Math.floor(34 * (taskCounts.completed / taskCounts.total));
    }
    return Math.max(0, Math.min(100, base));
}
export function countTasks(tasksContent) {
    if (!tasksContent) {
        return { total: 0, completed: 0 };
    }
    const matches = [...tasksContent.matchAll(/^\s*-\s*\[([x ~])\]/gm)];
    const total = matches.length;
    const completed = matches.filter((m) => m[1] === 'x').length;
    return { total, completed };
}
function computeContentDigest(contents) {
    const hash = createHash("sha256");
    const sortedKeys = Object.keys(contents).sort();
    for (const key of sortedKeys) {
        hash.update(contents[key]);
    }
    return hash.digest("hex");
}
export function normalize(raw, source) {
    const artifacts = {};
    for (const filename of Object.keys(raw.contents)) {
        artifacts[filename] = true;
    }
    const taskCounts = countTasks(raw.contents["tasks.md"]);
    const type = classifyType(artifacts, raw.config);
    const workflow = classifyWorkflow(artifacts);
    const stage = calculateStage(artifacts, taskCounts);
    const progress = calculateProgress(artifacts, taskCounts);
    const titleSource = raw.contents["requirements.md"] ??
        raw.contents["bugfix.md"] ??
        raw.contents["design.md"];
    // Prefer the spec folder name (slug) as the title — it's the spec's identity.
    // Only use the content heading if the folder name is a UUID or otherwise uninformative.
    const slugTitle = raw.slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const isUuidSlug = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(raw.slug);
    const title = isUuidSlug ? extractTitle(titleSource, raw.slug) : slugTitle;
    const specId = raw.config?.specId ?? raw.relativePath;
    const key = deriveKey(source.id, raw.config?.specId ?? null, raw.relativePath);
    const contentDigest = computeContentDigest(raw.contents);
    return {
        key,
        sourceId: source.id,
        specId,
        type,
        workflow,
        title,
        owner: raw.provenance.commitHash ? "unowned" : "unowned", // Git-derived owner handled by metadata layer
        stage,
        progress,
        provenance: raw.provenance,
        artifacts,
        taskCounts,
        contentDigest,
        indexedAt: new Date().toISOString(),
    };
}
