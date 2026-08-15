import React from 'react';
import type { ThemeMode, ViewMode } from '../hooks/useUrlState.js';
interface Props {
    view: ViewMode;
    themeMode: ThemeMode;
    onViewChange: (view: ViewMode) => void;
    onThemeChange: (mode: ThemeMode) => void;
}
/**
 * App chrome shown in both views: a view switcher (Relationship / Archive)
 * and a light/dark theme switcher. Theme applies to whichever view is active.
 */
export declare function AppChrome({ view, themeMode, onViewChange, onThemeChange, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=AppChrome.d.ts.map