import { type ReactNode } from 'react';
import { CrewProvider, useCrew, type CrewIntegration } from './hooks/useCrewIntegration.js';
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
import { ErrorBoundary } from './components/ErrorBoundary.js';
import './styles/global.css';

function AppProvider({
  children,
  overrides,
}: {
  children: ReactNode;
  overrides?: Partial<CrewIntegration>;
}) {
  return <CrewProvider overrides={overrides}>{children}</CrewProvider>;
}

function AppContent() {
  const { ready, error } = useCrew();
  const [urlState, setUrlState] = useUrlState();

  if (error) {
    return (
      <div role="alert" className="crew-error">
        <h2>Integration Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="loading" aria-busy="true">
        <p>Initializing…</p>
      </div>
    );
  }

  const { view, themeMode } = urlState;

  return (
    <div data-theme={themeMode} className={`app-root theme-${themeMode}`}>
      <AppChrome
        view={view}
        themeMode={themeMode}
        onViewChange={(v) => setUrlState({ view: v })}
        onThemeChange={(m) => setUrlState({ themeMode: m })}
      />
      {view === 'relationship' ? <RelationshipView /> : <ArchiveView />}
    </div>
  );
}

export function App({ crewOverrides }: { crewOverrides?: Partial<CrewIntegration> } = {}) {
  return (
    <ErrorBoundary>
      <AppProvider overrides={crewOverrides}>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
