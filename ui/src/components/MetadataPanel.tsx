import React, { useEffect, useRef, useState } from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
import type {
  MetadataPatch,
  PendingSuggestion,
  SpecDetail,
} from '../hooks/useSpecDetail.js';

interface Props {
  detail: SpecDetail;
  suggestions: PendingSuggestion[];
  saving: boolean;
  onSave: (patch: MetadataPatch) => Promise<boolean>;
  onAcceptSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
}

// ---------------------------------------------------------------------------
// A single inline-editable text field
// ---------------------------------------------------------------------------

function EditableField({
  label,
  value,
  placeholder,
  multiline,
  saving,
  commitTrigger,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  saving: boolean;
  /** When this value changes and the field is in editing mode, auto-commit. */
  commitTrigger?: unknown;
  onCommit: (next: string) => void;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const valueRef = useRef(value);
  valueRef.current = value;

  const start = (): void => {
    setDraft(value);
    setEditing(true);
  };
  const cancel = (): void => setEditing(false);
  const commit = (): void => {
    setEditing(false);
    if (draft !== value) onCommit(draft.trim());
  };

  // Auto-commit when the selection changes (commitTrigger changes) while editing
  const isFirstTrigger = useRef(true);
  useEffect(() => {
    if (isFirstTrigger.current) {
      isFirstTrigger.current = false;
      return;
    }
    if (editing) {
      setEditing(false);
      if (draftRef.current !== valueRef.current) {
        onCommit(draftRef.current.trim());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitTrigger]);

  return (
    <div className="meta-field">
      <div className="meta-field__head">
        <span className="meta-field__label">{label}</span>
        {!editing && (
          <button
            type="button"
            className="meta-field__edit"
            onClick={start}
            aria-label={`Edit ${label}`}
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="meta-field__editor">
          {multiline ? (
            <textarea
              value={draft}
              rows={3}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              aria-label={label}
            />
          ) : (
            <input
              type="text"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              aria-label={label}
            />
          )}
          <div className="meta-field__actions">
            <button type="button" onClick={commit} disabled={saving}>
              Save
            </button>
            <button type="button" onClick={cancel} className="meta-field__cancel">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={`meta-field__value${value ? '' : ' meta-field__value--empty'}`}>
          {value || placeholder || '—'}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetadataPanel
// ---------------------------------------------------------------------------

export function MetadataPanel({
  detail,
  suggestions,
  saving,
  onSave,
  onAcceptSuggestion,
  onRejectSuggestion,
}: Props): React.ReactElement {
  const { notify, chatLauncher } = useCrew();
  const { metadata } = detail;

  const [tagsEditing, setTagsEditing] = useState(false);
  const [tagsDraft, setTagsDraft] = useState(metadata.tags.join(', '));
  const tagsDraftRef = useRef(tagsDraft);
  tagsDraftRef.current = tagsDraft;

  const commitTags = (): void => {
    setTagsEditing(false);
    const next = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (next.join('|') !== metadata.tags.join('|')) {
      void onSave({ tags: next });
    }
  };

  // Auto-commit tags when selection changes
  const isFirstKeyChange = useRef(true);
  useEffect(() => {
    if (isFirstKeyChange.current) {
      isFirstKeyChange.current = false;
      return;
    }
    if (tagsEditing) {
      setTagsEditing(false);
      const next = tagsDraftRef.current
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (next.join('|') !== metadata.tags.join('|')) {
        void onSave({ tags: next });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.key]);

  // Export the current resolved metadata as a downloadable JSON sidecar.
  const handleExport = (): void => {
    const payload = {
      specKey: detail.key,
      metadata: {
        title: metadata.title,
        summary: metadata.summary,
        owner: metadata.owner,
        theme: metadata.theme,
        tags: metadata.tags,
        targetRelease: metadata.targetRelease,
        approvers: metadata.approvers,
        implementationRef: metadata.implementationRef,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.key}.spec-library.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          metadata?: MetadataPatch;
        };
        if (parsed.metadata) {
          void onSave(parsed.metadata);
        } else {
          notify.error('No metadata found in the imported file.');
        }
      } catch {
        notify.error('Could not parse the imported file as JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="metadata-panel" aria-label="Spec metadata">
      <header className="metadata-panel__head">
        <h3>Metadata</h3>
        <div className="metadata-panel__io">
          <label className="metadata-panel__import">
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="visually-hidden"
            />
          </label>
          <button type="button" onClick={handleExport}>
            Export
          </button>
        </div>
      </header>

      <EditableField
        label="Title"
        value={metadata.title}
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ title: v })}
      />
      <EditableField
        label="Summary"
        value={metadata.summary ?? ''}
        placeholder="No summary yet"
        multiline
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ summary: v })}
      />
      <EditableField
        label="Owner"
        value={metadata.owner}
        placeholder="Unassigned"
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ owner: v })}
      />
      <EditableField
        label="Theme"
        value={metadata.theme ?? ''}
        placeholder="No theme"
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ theme: v })}
      />

      {/* Tags — comma-separated editor */}
      <div className="meta-field">
        <div className="meta-field__head">
          <span className="meta-field__label">Tags</span>
          {!tagsEditing && (
            <button
              type="button"
              className="meta-field__edit"
              onClick={() => {
                setTagsDraft(metadata.tags.join(', '));
                setTagsEditing(true);
              }}
              aria-label="Edit tags"
            >
              Edit
            </button>
          )}
        </div>
        {tagsEditing ? (
          <div className="meta-field__editor">
            <input
              type="text"
              value={tagsDraft}
              autoFocus
              onChange={(e) => setTagsDraft(e.target.value)}
              aria-label="Tags, comma separated"
            />
            <small>Separate tags with commas.</small>
            <div className="meta-field__actions">
              <button type="button" onClick={commitTags} disabled={saving}>
                Save
              </button>
              <button
                type="button"
                className="meta-field__cancel"
                onClick={() => setTagsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : metadata.tags.length > 0 ? (
          <div className="meta-tags">
            {metadata.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        ) : (
          <p className="meta-field__value meta-field__value--empty">No tags</p>
        )}
      </div>

      <EditableField
        label="Target release"
        value={metadata.targetRelease ?? ''}
        placeholder="Unscheduled"
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ targetRelease: v })}
      />

      {/* Review cadence — removed (deprecated) */}

      {/* Approvers — read-only comma-separated list */}
      <div className="meta-field">
        <div className="meta-field__head">
          <span className="meta-field__label">Approvers</span>
        </div>
        <p className={`meta-field__value${metadata.approvers.length > 0 ? '' : ' meta-field__value--empty'}`}>
          {metadata.approvers.length > 0 ? metadata.approvers.join(', ') : 'None'}
        </p>
      </div>

      {/* Implementation link — editable */}
      <EditableField
        label="Implementation link"
        value={metadata.implementationRef ?? ''}
        placeholder="No link"
        saving={saving}
        commitTrigger={detail.key}
        onCommit={(v) => void onSave({ implementationRef: v })}
      />

      {/* Created date — read-only */}
      <div className="meta-field">
        <div className="meta-field__head">
          <span className="meta-field__label">Created</span>
        </div>
        <p className="meta-field__value">
          {detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : '—'}
        </p>
      </div>

      {/* Completed date — read-only */}
      {detail.completedAt && (
        <div className="meta-field">
          <div className="meta-field__head">
            <span className="meta-field__label">Completed</span>
          </div>
          <p className="meta-field__value">
            {new Date(detail.completedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Reviewed status */}
      <div className="meta-field">
        <div className="meta-field__head">
          <span className="meta-field__label">Reviewed</span>
        </div>
        {metadata.reviewedAt ? (
          <p className="meta-field__value">
            ✓ {new Date(metadata.reviewedAt).toLocaleDateString()}
          </p>
        ) : (
          <button
            type="button"
            className="meta-field__mark-reviewed"
            disabled={saving}
            onClick={() => void onSave({ reviewedAt: new Date().toISOString() })}
          >
            Mark as reviewed
          </button>
        )}
      </div>

      {/* Relationships / pending suggestions */}
      <div className="metadata-panel__relationships">
        <h4>Suggested relationships</h4>
        {suggestions.length === 0 ? (
          <p className="meta-field__value meta-field__value--empty">
            No pending suggestions.
          </p>
        ) : (
          <ul className="suggestion-list">
            {suggestions.map((s) => (
              <li key={s.id} className="suggestion">
                <div className="suggestion__body">
                  <span className="suggestion__type">{s.type}</span>
                  <strong className="suggestion__target">{s.targetSpecKey}</strong>
                  <span className="suggestion__evidence">{s.evidence}</span>
                  <span className="suggestion__confidence">
                    {Math.round(s.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="suggestion__actions">
                  <button
                    type="button"
                    className="suggestion__why"
                    onClick={() => {
                      chatLauncher.open({
                        specId: detail.key,
                        prompt: `Explain this suggested relationship:\n- Source: ${metadata.title} (${detail.key})\n- Target: ${s.targetSpecKey}\n- Type: ${s.type}\n- Confidence: ${Math.round(s.confidence * 100)}%\n- Evidence: ${s.evidence}\n\nShow me the relevant content from both specs that supports or contradicts this suggestion.`,
                      });
                    }}
                    title="Open Crew chat to explain this suggestion"
                  >
                    Why?
                  </button>
                  <button
                    type="button"
                    className="suggestion__accept"
                    onClick={() => onAcceptSuggestion(s.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="suggestion__reject"
                    onClick={() => onRejectSuggestion(s.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
