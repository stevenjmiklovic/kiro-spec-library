import React from 'react';
interface Props {
    onClose: () => void;
}
/**
 * Backup & restore surface: a whole-library binary backup (download/restore,
 * full replace, requires a backend restart) and a textual/git-committable
 * export (download/apply, merges metadata + relationships + suggestions +
 * rejections + proposals into the current library — it doesn't touch audit
 * history or archived snapshot content).
 */
export declare function BackupPanel({ onClose }: Props): React.ReactElement;
export {};
//# sourceMappingURL=BackupPanel.d.ts.map