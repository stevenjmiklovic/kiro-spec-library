import React from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
import type { SpecDetail } from '../hooks/useSpecDetail.js';

interface Props {
  detail: SpecDetail;
}

/**
 * Build a repository web permalink from provenance, when a web URL template
 * can be derived from the remote. Returns null when no web URL is available
 * (e.g. SSH-only remotes or local sources) — the permalink is then disabled.
 */
export function buildPermalink(detail: SpecDetail): string | null {
  const { remoteUrl, relativePath, commitHash, branch } = detail.provenance;
  if (!remoteUrl) return null;

  // Normalize common Git remote forms to an https host/owner/repo base.
  let base: string | null = null;
  const https = remoteUrl.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?\/?$/);
  const ssh = remoteUrl.match(/^git@([^:]+):(.+?)(?:\.git)?\/?$/);
  if (https) base = `https://${https[1]}/${https[2]}`;
  else if (ssh) base = `https://${ssh[1]}/${ssh[2]}`;
  if (!base) return null;

  const host = base.replace(/^https:\/\//, '').split('/')[0] ?? '';
  const ref = commitHash || branch || 'main';
  const path = relativePath.replace(/^\/+/, '');

  // GitHub / Gitea style: /tree/<ref>/<path>; GitLab: /-/tree/<ref>/<path>.
  if (host.includes('gitlab')) return `${base}/-/tree/${ref}/${path}`;
  return `${base}/tree/${ref}/${path}`;
}

export function SpecActions({ detail }: Props): React.ReactElement {
  const { chatLauncher } = useCrew();
  const permalink = buildPermalink(detail);
  const { isDirty, commitHash } = detail.provenance;

  const openInChat = (): void => {
    const specLabel = detail.metadata.title || detail.specId || detail.key;
    const prompt = `Tell me about the spec "${specLabel}" (key: ${detail.key})`;

    // Gateway SDK chatLauncher.open navigates to a new chat with context.
    // If that's not wired (mock/standalone), fall back to navigate().
    chatLauncher.open({
      specId: detail.specId || detail.key,
      revisionId: commitHash || undefined,
      prompt,
      agent: 'spectral-librarian',
    });
  };

  return (
    <div className="spec-actions" role="group" aria-label="Spec actions">
      <button
        type="button"
        className="spec-actions__primary"
        onClick={openInChat}
      >
        Open in Crew chat
      </button>

      <div className="spec-actions__permalink">
        {permalink ? (
          <a
            className="spec-actions__link"
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Repository permalink ↗
          </a>
        ) : (
          <span
            className="spec-actions__link spec-actions__link--disabled"
            aria-disabled="true"
            title="No web URL is available for this source"
          >
            Repository permalink
          </span>
        )}
        {isDirty && (
          <span
            className="spec-actions__dirty"
            title="Working tree has uncommitted changes; the permalink points at the last commit"
          >
            ● Uncommitted changes
          </span>
        )}
      </div>
    </div>
  );
}
