import React from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
import type { PendingProposal } from '../hooks/useSpecDetail.js';

interface Props {
  proposals: PendingProposal[];
  specKey: string;
  specTitle: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

/**
 * Human-in-the-loop approval gate for agent-submitted metadata proposals.
 * Shows each pending proposal as a card with a diff preview of proposed
 * changes plus Accept/Reject actions.
 */
export function ProposalQueue({ proposals, specKey, specTitle, onAccept, onReject }: Props): React.ReactElement | null {
  const { chatLauncher } = useCrew();

  if (proposals.length === 0) return null;

  return (
    <section className="proposal-queue" aria-label="Pending metadata proposals">
      <header className="proposal-queue__header">
        <h4>
          Pending proposals
          <span className="proposal-queue__count">{proposals.length}</span>
        </h4>
        <p className="proposal-queue__subtitle">
          Agent-submitted changes awaiting your approval.
        </p>
      </header>

      <ul className="proposal-queue__list">
        {proposals.map((p) => (
          <ProposalCard
            key={p.id}
            proposal={p}
            specKey={specKey}
            specTitle={specTitle}
            onAccept={onAccept}
            onReject={onReject}
            onChat={(prompt) => chatLauncher.open({ specId: specKey, prompt })}
          />
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Single proposal card
// ---------------------------------------------------------------------------

function ProposalCard({
  proposal,
  specKey,
  specTitle,
  onAccept,
  onReject,
  onChat,
}: {
  proposal: PendingProposal;
  specKey: string;
  specTitle: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onChat: (prompt: string) => void;
}): React.ReactElement {
  const fields = Object.entries(proposal.patch);
  const submittedDate = proposal.submittedAt
    ? new Date(proposal.submittedAt).toLocaleString()
    : 'Unknown';

  const buildChatPrompt = (): string => {
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

  return (
    <li className="proposal-card">
      <div className="proposal-card__meta">
        <span className="proposal-card__source">
          {proposal.source === 'agent' ? '🤖 Agent' : '📝 Manual'}
        </span>
        <time className="proposal-card__time" dateTime={proposal.submittedAt}>
          {submittedDate}
        </time>
      </div>

      {proposal.rationale && (
        <p className="proposal-card__rationale">{proposal.rationale}</p>
      )}

      <div className="proposal-card__diff">
        {fields.map(([key, value]) => (
          <div key={key} className="proposal-card__field">
            <span className="proposal-card__key">{formatFieldName(key)}</span>
            <span className="proposal-card__value">
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="proposal-card__actions">
        <button
          type="button"
          className="proposal-card__chat"
          onClick={() => onChat(buildChatPrompt())}
          title="Open Crew chat to discuss this proposal"
        >
          Why?
        </button>
        <button
          type="button"
          className="proposal-card__accept"
          onClick={() => onAccept(proposal.id)}
          aria-label={`Accept proposal ${proposal.id.slice(0, 8)}`}
        >
          ✓ Accept
        </button>
        <button
          type="button"
          className="proposal-card__reject"
          onClick={() => onReject(proposal.id)}
          aria-label={`Reject proposal ${proposal.id.slice(0, 8)}`}
        >
          ✗ Reject
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(clear)';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
