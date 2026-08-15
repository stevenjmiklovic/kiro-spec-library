import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
/**
 * Human-in-the-loop approval gate for agent-submitted metadata proposals.
 * Shows each pending proposal as a card with a diff preview of proposed
 * changes plus Accept/Reject actions.
 */
export function ProposalQueue({ proposals, specKey, specTitle, onAccept, onReject }) {
    const { chatLauncher } = useCrew();
    if (proposals.length === 0)
        return null;
    return (_jsxs("section", { className: "proposal-queue", "aria-label": "Pending metadata proposals", children: [_jsxs("header", { className: "proposal-queue__header", children: [_jsxs("h4", { children: ["Pending proposals", _jsx("span", { className: "proposal-queue__count", children: proposals.length })] }), _jsx("p", { className: "proposal-queue__subtitle", children: "Agent-submitted changes awaiting your approval." })] }), _jsx("ul", { className: "proposal-queue__list", children: proposals.map((p) => (_jsx(ProposalCard, { proposal: p, specKey: specKey, specTitle: specTitle, onAccept: onAccept, onReject: onReject, onChat: (prompt) => chatLauncher.open({ specId: specKey, prompt }) }, p.id))) })] }));
}
// ---------------------------------------------------------------------------
// Single proposal card
// ---------------------------------------------------------------------------
function ProposalCard({ proposal, specKey, specTitle, onAccept, onReject, onChat, }) {
    const fields = Object.entries(proposal.patch);
    const submittedDate = proposal.submittedAt
        ? new Date(proposal.submittedAt).toLocaleString()
        : 'Unknown';
    const buildChatPrompt = () => {
        const fieldSummary = fields
            .map(([k, v]) => `  • ${formatFieldName(k)}: ${formatValue(v)}`)
            .join('\n');
        return [
            `Help me decide on this metadata proposal for "${specTitle}" (${specKey}):`,
            '',
            `Proposed changes:`,
            fieldSummary,
            '',
            proposal.rationale ? `Agent rationale: ${proposal.rationale}` : '',
            '',
            `Use get_spec_context to read the current spec and tell me whether these proposed metadata values are accurate and should be accepted, or if they're wrong/incomplete and should be rejected.`,
        ].filter(Boolean).join('\n');
    };
    return (_jsxs("li", { className: "proposal-card", children: [_jsxs("div", { className: "proposal-card__meta", children: [_jsx("span", { className: "proposal-card__source", children: proposal.source === 'agent' ? '🤖 Agent' : '📝 Manual' }), _jsx("time", { className: "proposal-card__time", dateTime: proposal.submittedAt, children: submittedDate })] }), proposal.rationale && (_jsx("p", { className: "proposal-card__rationale", children: proposal.rationale })), _jsx("div", { className: "proposal-card__diff", children: fields.map(([key, value]) => (_jsxs("div", { className: "proposal-card__field", children: [_jsx("span", { className: "proposal-card__key", children: formatFieldName(key) }), _jsx("span", { className: "proposal-card__value", children: formatValue(value) })] }, key))) }), _jsxs("div", { className: "proposal-card__actions", children: [_jsx("button", { type: "button", className: "proposal-card__chat", onClick: () => onChat(buildChatPrompt()), title: "Open Crew chat to discuss this proposal", children: "Why?" }), _jsx("button", { type: "button", className: "proposal-card__accept", onClick: () => onAccept(proposal.id), "aria-label": `Accept proposal ${proposal.id.slice(0, 8)}`, children: "\u2713 Accept" }), _jsx("button", { type: "button", className: "proposal-card__reject", onClick: () => onReject(proposal.id), "aria-label": `Reject proposal ${proposal.id.slice(0, 8)}`, children: "\u2717 Reject" })] })] }));
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatFieldName(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
}
function formatValue(value) {
    if (value === null || value === undefined)
        return '(clear)';
    if (Array.isArray(value))
        return value.join(', ');
    if (typeof value === 'object')
        return JSON.stringify(value);
    return String(value);
}
