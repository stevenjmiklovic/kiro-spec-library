import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
/**
 * Build a repository web permalink from provenance, when a web URL template
 * can be derived from the remote. Returns null when no web URL is available
 * (e.g. SSH-only remotes or local sources) — the permalink is then disabled.
 */
export function buildPermalink(detail) {
    const { remoteUrl, relativePath, commitHash, branch } = detail.provenance;
    if (!remoteUrl)
        return null;
    // Normalize common Git remote forms to an https host/owner/repo base.
    let base = null;
    const https = remoteUrl.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?\/?$/);
    const ssh = remoteUrl.match(/^git@([^:]+):(.+?)(?:\.git)?\/?$/);
    if (https)
        base = `https://${https[1]}/${https[2]}`;
    else if (ssh)
        base = `https://${ssh[1]}/${ssh[2]}`;
    if (!base)
        return null;
    const host = base.replace(/^https:\/\//, '').split('/')[0] ?? '';
    const ref = commitHash || branch || 'main';
    const path = relativePath.replace(/^\/+/, '');
    // GitHub / Gitea style: /tree/<ref>/<path>; GitLab: /-/tree/<ref>/<path>.
    if (host.includes('gitlab'))
        return `${base}/-/tree/${ref}/${path}`;
    return `${base}/tree/${ref}/${path}`;
}
export function SpecActions({ detail }) {
    const { chatLauncher } = useCrew();
    const permalink = buildPermalink(detail);
    const { isDirty, commitHash } = detail.provenance;
    const openInChat = () => {
        const specLabel = detail.metadata.title || detail.specId || detail.key;
        const prompt = `Tell me about the spec "${specLabel}" (key: ${detail.key})`;
        // Gateway SDK chatLauncher.open navigates to a new chat with context.
        // If that's not wired (mock/standalone), fall back to navigate().
        chatLauncher.open({
            specId: detail.specId || detail.key,
            revisionId: commitHash || undefined,
            prompt,
            agent: 'spec-librarian',
        });
    };
    return (_jsxs("div", { className: "spec-actions", role: "group", "aria-label": "Spec actions", children: [_jsx("button", { type: "button", className: "spec-actions__primary", onClick: openInChat, children: "Open in Crew chat" }), _jsxs("div", { className: "spec-actions__permalink", children: [permalink ? (_jsx("a", { className: "spec-actions__link", href: permalink, target: "_blank", rel: "noopener noreferrer", children: "Repository permalink \u2197" })) : (_jsx("span", { className: "spec-actions__link spec-actions__link--disabled", "aria-disabled": "true", title: "No web URL is available for this source", children: "Repository permalink" })), isDirty && (_jsx("span", { className: "spec-actions__dirty", title: "Working tree has uncommitted changes; the permalink points at the last commit", children: "\u25CF Uncommitted changes" }))] })] }));
}
