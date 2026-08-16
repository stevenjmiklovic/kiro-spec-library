import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getLocalAliases, setLocalAliases } from '../hooks/useLocalAliases.js';

interface Props {
  onClose: () => void;
}

/**
 * Lets a person tell this browser which git author names/emails are
 * "theirs" — RelationshipView.tsx's "Mine" scope filter reads this list to
 * decide which specs to show. Client-only/localStorage-backed by design
 * (see useLocalAliases.ts): there's no server-side user-identity concept
 * in this app yet.
 */
export function AliasesPanel({ onClose }: Props): React.ReactElement {
  const [text, setText] = useState(() => getLocalAliases().join(', '));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = (): void => {
    const aliases = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setLocalAliases(aliases);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="backup-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mine — your aliases"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="backup-panel__header">
          <h2>Mine — your aliases</h2>
          <button type="button" className="backup-panel__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <section className="backup-panel__section">
          <p>
            Comma-separated git author names or emails that are yours. The Relationship
            view&rsquo;s &ldquo;Mine&rdquo; scope filter uses this list — stored only in this
            browser, not shared with anyone else.
          </p>
          <label className="backup-panel__confirm-label">
            <span>Your aliases</span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Maya Chen, maya@example.com"
              aria-label="Comma-separated aliases"
            />
          </label>
          <button type="button" className="backup-panel__primary" onClick={handleSave}>
            {saved ? 'Saved!' : 'Save'}
          </button>
        </section>
      </div>
    </div>
  );
}
