import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
/**
 * App chrome shown in both views: a view switcher (Relationship / Archive)
 * and a light/dark theme switcher. Theme applies to whichever view is active.
 */
export function AppChrome({ view, themeMode, onViewChange, onThemeChange, }) {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    const [copyLabel, setCopyLabel] = useState('Copy link');
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopyLabel('Copied!');
        setTimeout(() => setCopyLabel('Copy link'), 1500);
    };
    return (_jsxs("div", { className: "app-chrome", children: [_jsxs("div", { className: "view-switcher", role: "tablist", "aria-label": "View", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": view === 'relationship', className: view === 'relationship' ? 'active' : undefined, onClick: () => onViewChange('relationship'), children: "Relationships" }), _jsx("button", { type: "button", role: "tab", "aria-selected": view === 'archive', className: view === 'archive' ? 'active' : undefined, onClick: () => onViewChange('archive'), children: "Archive" })] }), _jsxs("div", { className: "chrome-actions", children: [_jsx("button", { type: "button", className: "copy-link-btn", onClick: handleCopyLink, "aria-label": "Copy current page link", title: "Copy current page link", children: copyLabel }), _jsx("button", { type: "button", className: "theme-switcher", onClick: () => onThemeChange(nextTheme), "aria-label": `Switch to ${nextTheme} theme`, title: `Switch to ${nextTheme} theme`, children: themeMode === 'dark' ? '☾ Dark' : '☀ Light' })] })] }));
}
