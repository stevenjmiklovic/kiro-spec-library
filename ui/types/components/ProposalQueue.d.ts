import React from 'react';
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
export declare function ProposalQueue({ proposals, specKey, specTitle, onAccept, onReject }: Props): React.ReactElement | null;
export {};
//# sourceMappingURL=ProposalQueue.d.ts.map