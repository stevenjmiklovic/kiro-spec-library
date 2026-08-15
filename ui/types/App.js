import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {} from 'react';
import { CrewProvider, useCrew } from './hooks/useCrewIntegration.js';
import { useUrlState } from './hooks/useUrlState.js';
import { RelationshipView } from './views/RelationshipView.js';
import { ArchiveView } from './views/ArchiveView.js';
// Self-inject CSS — gateway provides no CSS loading
const cssUrl = new URL('./index.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${cssUrl}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    document.head.appendChild(link);
}
import { AppChrome } from './components/AppChrome.js';
import './styles/global.css';
// Temporarily skip the ErrorBoundary — render AppProvider directly
function AppProvider({ children, overrides, }) {
    return _jsx(CrewProvider, { overrides: overrides, children: children });
}
function AppContent() {
    const { ready, error } = useCrew();
    const [urlState, setUrlState] = useUrlState();
    if (error) {
        return (_jsxs("div", { role: "alert", className: "crew-error", children: [_jsx("h2", { children: "Integration Error" }), _jsx("p", { children: error })] }));
    }
    if (!ready) {
        return (_jsx("div", { className: "loading", "aria-busy": "true", children: _jsx("p", { children: "Initializing\u2026" }) }));
    }
    const { view, themeMode } = urlState;
    return (_jsxs("div", { "data-theme": themeMode, className: `app-root theme-${themeMode}`, children: [_jsx(AppChrome, { view: view, themeMode: themeMode, onViewChange: (v) => setUrlState({ view: v }), onThemeChange: (m) => setUrlState({ themeMode: m }) }), view === 'relationship' ? _jsx(RelationshipView, {}) : _jsx(ArchiveView, {})] }));
}
export function App({ crewOverrides } = {}) {
    return (_jsx(AppProvider, { overrides: crewOverrides, children: _jsx(AppContent, {}) }));
}
export default App;
