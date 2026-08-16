import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useCallback, type KeyboardEvent } from 'react';
import { Sparkles, AlertTriangle, Zap, Search, type LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Data shape
// ---------------------------------------------------------------------------

export type SpecType = 'feature' | 'bugfix' | 'quick' | 'unknown';

export interface SpecNodeData {
  id: string;
  title: string;
  type: SpecType;
  stage: string;
  progress: number;
  owner: string;
  theme: string;
  selected?: boolean;
  superseded?: boolean;
  reviewed?: boolean;
  onSelect?: (id: string) => void;
  [key: string]: unknown;
}

/** React Flow node type carrying SpecNodeData. */
export type SpecNodeType = Node<SpecNodeData>;

// ---------------------------------------------------------------------------
// Type glyphs
// ---------------------------------------------------------------------------

const TYPE_GLYPHS: Record<SpecType, LucideIcon> = {
  feature: Sparkles,
  bugfix: AlertTriangle,
  quick: Zap,
  unknown: Search,
};

const TYPE_LABELS: Record<SpecType, string> = {
  feature: 'Feature',
  bugfix: 'Bugfix',
  quick: 'Quick',
  unknown: 'Unknown',
};

// ---------------------------------------------------------------------------
// Node component
// ---------------------------------------------------------------------------

export function SpecNode({ data }: NodeProps<SpecNodeType>) {
  const {
    id,
    title,
    type,
    stage,
    progress,
    owner,
    selected,
    superseded,
    reviewed,
    onSelect,
  } = data;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(id);
      }
    },
    [onSelect, id],
  );

  const handleClick = useCallback(() => {
    onSelect?.(id);
  }, [onSelect, id]);

  const ariaLabel = `${title}, ${TYPE_LABELS[type]}, ${stage}, ${progress}%`;
  const isSelected = selected ?? false;
  const TypeGlyph = TYPE_GLYPHS[type];

  return (
    <button
      type="button"
      className={`spec-node spec-node--${type}${isSelected ? ' spec-node--selected' : ''}${superseded ? ' spec-node--superseded' : ''}`}
      data-stage={stage}
      data-type={type}
      data-selected={isSelected || undefined}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Handle type="target" position={Position.Left} />

      {/* Header: type glyph + type label + reviewed badge */}
      <span className="spec-node__header">
        <span className="spec-node__glyph" aria-hidden="true">
          <TypeGlyph size={14} />
        </span>
        <span className="spec-node__type-label">{TYPE_LABELS[type]}</span>
        {reviewed && (
          <span className="spec-node__reviewed" title="Reviewed" aria-label="Reviewed">✓</span>
        )}
      </span>

      {/* Title — wraps up to two lines */}
      <strong className="spec-node__title">{title}</strong>

      {/* Stage / progress / owner line */}
      <span className="spec-node__meta">
        <span className="spec-node__stage">{stage}</span>
        {' · '}
        <span className="spec-node__progress">{progress}%</span>
        {owner && (
          <>
            {' · '}
            <span className="spec-node__owner">{owner}</span>
          </>
        )}
      </span>

      <Handle type="source" position={Position.Right} />
    </button>
  );
}

/** Alias for consumers that import as `NodeComponent`. */
export { SpecNode as NodeComponent };
