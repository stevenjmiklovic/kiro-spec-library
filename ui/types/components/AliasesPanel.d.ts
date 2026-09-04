import React from 'react';
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
export declare function AliasesPanel({ onClose }: Props): React.ReactElement;
export {};
//# sourceMappingURL=AliasesPanel.d.ts.map