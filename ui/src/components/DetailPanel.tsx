import type React from "react";
import { useEffect } from "react";
import { useSpecDetail } from "../hooks/useSpecDetail.js";
import { MetadataPanel } from "./MetadataPanel.js";
import { ProposalQueue } from "./ProposalQueue.js";
import { SpecActions } from "./SpecActions.js";

interface Props {
  specKey: string | undefined;
  /** 'rail' = right inspection rail (Relationship); 'drawer' = Archive drawer. */
  variant?: "rail" | "drawer";
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
  variant = "rail",
  onClose,
}: Props): React.ReactElement | null {
  const {
    detail,
    suggestions,
    proposals,
    loading,
    saving,
    error,
    errorStatus,
    save,
    acceptSuggestion,
    rejectSuggestion,
    acceptProposal,
    rejectProposal,
    refetch,
  } = useSpecDetail(specKey);

  // Escape-to-close (works for both rail and drawer variants)
  useEffect(() => {
    if (!onClose) return undefined;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
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
        <div className="detail-panel__error" role="alert">
          <p className="detail-panel__error-title">
            {errorStatus === 404 ? "This spec couldn’t be found" : "Couldn’t load this spec"}
          </p>
          <p className="detail-panel__error-body">
            {errorStatus === 404
              ? "It may have been renamed, moved, or removed since the last scan. Rescanning refreshes the library from your sources."
              : "The spec detail didn’t load. This is usually a temporary connection issue — retrying often works."}
          </p>
          <div className="detail-panel__error-actions">
            <button
              type="button"
              className="detail-panel__error-btn detail-panel__error-btn--primary"
              onClick={() => refetch()}
            >
              Retry
            </button>
            <button
              type="button"
              className="detail-panel__error-btn"
              onClick={() => window.dispatchEvent(new CustomEvent("spec-library:request-rescan"))}
            >
              Rescan library
            </button>
          </div>
        </div>
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
