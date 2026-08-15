import React, { useEffect } from 'react';
import { useSpecDetail } from '../hooks/useSpecDetail.js';
import { SpecActions } from './SpecActions.js';
import { MetadataPanel } from './MetadataPanel.js';
import { ProposalQueue } from './ProposalQueue.js';

interface Props {
  specKey: string | undefined;
  /** 'rail' = right inspection rail (Relationship); 'drawer' = Archive drawer. */
  variant?: 'rail' | 'drawer';
  onClose?: () => void;
}

/**
 * Full spec inspection surface: identity header, spec actions (open in chat /
 * repo permalink), and the editable metadata panel with pending suggestions.
 * Rendered as a right rail in the Relationship View and inside a drawer on
 * narrow layouts.
 */
export function DetailPanel({
  specKey,
  variant = 'rail',
  onClose,
}: Props): React.ReactElement | null {
  const {
    detail,
    suggestions,
    proposals,
    loading,
    saving,
    error,
    save,
    acceptSuggestion,
    rejectSuggestion,
    acceptProposal,
    rejectProposal,
  } = useSpecDetail(specKey);

  // Escape-to-close (works for both rail and drawer variants)
  useEffect(() => {
    if (!onClose) return undefined;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!specKey) return null;

  return (
    <aside
      className={`detail-panel detail-panel--${variant}`}
      aria-label="Spec detail"
      aria-busy={loading}
    >
      {onClose && (
        <button
          type="button"
          className="detail-panel__close"
          onClick={onClose}
          aria-label="Close detail"
        >
          ✕
        </button>
      )}

      {loading && !detail && (
        <p className="detail-panel__status" role="status">
          Loading spec…
        </p>
      )}

      {error && !detail && (
        <p className="detail-panel__status" role="alert">
          {error}
        </p>
      )}

      {detail && (
        <>
          <header className="detail-panel__header">
            <p className="detail-panel__eyebrow">
              {detail.type} · {detail.stage} · {detail.progress}%
            </p>
            <h2 className="detail-panel__title">
              {detail.metadata.title}
              {saving && (
                <span className="detail-panel__saving" role="status" aria-live="polite">
                  Saving…
                </span>
              )}
            </h2>
            <p className="detail-panel__key">{detail.key}</p>
          </header>

          <SpecActions detail={detail} />

          <ProposalQueue
            proposals={proposals}
            specKey={detail.key}
            specTitle={detail.metadata.title}
            onAccept={acceptProposal}
            onReject={rejectProposal}
          />

          <MetadataPanel
            detail={detail}
            suggestions={suggestions}
            saving={saving}
            onSave={save}
            onAcceptSuggestion={acceptSuggestion}
            onRejectSuggestion={rejectSuggestion}
          />
        </>
      )}
    </aside>
  );
}
