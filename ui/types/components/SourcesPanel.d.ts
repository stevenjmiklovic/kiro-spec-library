import React from 'react';
interface Props {
    onClose: () => void;
}
/**
 * Source management + getting-started surface. Lists configured repository
 * sources, lets the user add local paths or remote Git URLs, remove them, and
 * "Save & rescan" — which persists the set via PUT /settings/sources then
 * triggers POST /sync and polls it to completion. This is the primary
 * onboarding path: a fresh install has no sources, so nothing appears until
 * one is added here.
 */
export declare function SourcesPanel({ onClose }: Props): React.ReactElement;
export {};
//# sourceMappingURL=SourcesPanel.d.ts.map