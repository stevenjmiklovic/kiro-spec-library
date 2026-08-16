import { createContext, useContext, useMemo, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CrewTheme {
  mode: 'light' | 'dark';
  colors: Record<string, string>;
}

export interface CrewAppApi {
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

export interface CrewNotify {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

export interface CrewNavigate {
  (path: string): void;
}

export interface CrewChatLauncher {
  open(context?: { specId?: string; revisionId?: string; prompt?: string; agent?: string }): void;
}

export interface CrewIntegration {
  theme: CrewTheme;
  api: CrewAppApi;
  notify: CrewNotify;
  navigate: CrewNavigate;
  chatLauncher: CrewChatLauncher;
  ready: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Gateway SDK adapter
// ---------------------------------------------------------------------------

interface GatewayAppApi {
  get(path: string): Promise<unknown>;
  post(path: string, body?: unknown): Promise<unknown>;
  patch(path: string, body?: unknown): Promise<unknown>;
  delete(path: string): Promise<unknown>;
  fetch?(path: string, init?: RequestInit): Promise<Response>;
}

function wrapGatewayApi(gatewayApi: GatewayAppApi): CrewAppApi {
  return {
    async fetch(path: string, init?: RequestInit): Promise<Response> {
      const proxyPath = path.startsWith('/apps/')
        ? path
        : `/apps/kiro-spec-library/api${path}`;

      // The SDK's get/post methods normalize paths through new URL() which
      // decodes %2F back to / — breaking paths that contain encoded slashes
      // (e.g. spec keys like "counter-table::.kiro/specs/foo").
      // Use direct fetch for ALL requests since we're same-origin and the
      // dashboard session cookie provides authentication automatically.
      return globalThis.fetch(proxyPath, {
        ...init,
        credentials: 'include',
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Mock implementations (dev/standalone mode)
// ---------------------------------------------------------------------------

const mockTheme: CrewTheme = {
  mode: 'light',
  colors: {
    primary: '#002D72',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    border: '#e0e0e0',
  },
};

const mockApi: CrewAppApi = {
  async fetch(path: string, init?: RequestInit): Promise<Response> {
    const ports = [9102, 9150, 3100];
    for (const port of ports) {
      try {
        const res = await globalThis.fetch(`http://127.0.0.1:${port}/api${path}`, init);
        return res;
      } catch {
        continue;
      }
    }
    throw new Error('Backend not reachable on any dev port');
  },
};

const mockNotify: CrewNotify = {
  success: (msg) => console.info(`[SpecLibrary] ✓ ${msg}`),
  error: (msg) => console.error(`[SpecLibrary] ✗ ${msg}`),
  info: (msg) => console.info(`[SpecLibrary] ℹ ${msg}`),
};

const mockNavigate: CrewNavigate = (path) => {
  window.location.href = path;
};

function buildChatLauncher(navigate: CrewNavigate): CrewChatLauncher {
  return {
    open: (ctx) => {
      const prompt = ctx?.prompt ?? `Discuss spec ${ctx?.specId ?? 'unknown'}`;
      const encoded = encodeURIComponent(prompt);
      const agentParam = ctx?.agent ? `&agent=${encodeURIComponent(ctx.agent)}` : '';
      navigate(`/chat?prompt=${encoded}${agentParam}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Detect SDK availability (non-hook, safe to call anywhere)
// ---------------------------------------------------------------------------

function hasSdk(): boolean {
  return !!(globalThis as any).__kirocrew_modules?.['@kirocrew/app-sdk'];
}

function getSdkModule(): Record<string, any> | null {
  return (globalThis as any).__kirocrew_modules?.['@kirocrew/app-sdk'] ?? null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const defaultIntegration: CrewIntegration = {
  theme: mockTheme,
  api: mockApi,
  notify: mockNotify,
  navigate: mockNavigate,
  chatLauncher: buildChatLauncher(mockNavigate),
  ready: true,
};

const CrewContext = createContext<CrewIntegration>(defaultIntegration);

// ---------------------------------------------------------------------------
// Provider — calls SDK hooks inside a React component (Rules of Hooks safe)
// ---------------------------------------------------------------------------

export interface CrewProviderProps {
  children: ReactNode;
  overrides?: Partial<CrewIntegration>;
}

/**
 * Internal component that calls the gateway SDK hooks.
 * Separated so we can conditionally render it only when the SDK exists.
 */
function SdkBridge({ children, overrides }: CrewProviderProps) {
  // These are React hooks from the gateway SDK — safe to call here
  // because this component only renders when the SDK is available.
  const sdk = getSdkModule()!;
  const gatewayApi: GatewayAppApi = sdk.useAppApi();
  const theme: CrewTheme = sdk.useTheme?.() ?? mockTheme;
  const navigate: CrewNavigate = sdk.useNavigate?.() ?? mockNavigate;
  const notify: CrewNotify = sdk.useNotify?.() ?? mockNotify;
  const chatLauncher: CrewChatLauncher = (() => {
    const raw = sdk.useChatLauncher?.();
    if (raw?.openChat) {
      // Gateway SDK returns { openChat(opts) } — bridge to our .open() interface
      return {
        open: (ctx) => {
          raw.openChat({
            agent: ctx?.agent ?? 'spectral-librarian',
            message: ctx?.prompt ?? `Discuss spec ${ctx?.specId ?? 'unknown'}`,
          });
        },
      };
    }
    return buildChatLauncher(navigate);
  })();

  const api = useMemo(() => wrapGatewayApi(gatewayApi), [gatewayApi]);

  const integration = useMemo<CrewIntegration>(() => {
    const base: CrewIntegration = { theme, api, notify, navigate, chatLauncher, ready: true };
    return overrides ? { ...base, ...overrides } : base;
  }, [theme, api, notify, navigate, chatLauncher, overrides]);

  return (
    <CrewContext.Provider value={integration}>
      {children}
    </CrewContext.Provider>
  );
}

/**
 * Standalone fallback — no SDK, uses mock implementations for dev mode.
 */
function MockBridge({ children, overrides }: CrewProviderProps) {
  const integration = useMemo<CrewIntegration>(() => {
    return overrides ? { ...defaultIntegration, ...overrides } : defaultIntegration;
  }, [overrides]);

  return (
    <CrewContext.Provider value={integration}>
      {children}
    </CrewContext.Provider>
  );
}

export function CrewProvider({ children, overrides }: CrewProviderProps) {
  if (hasSdk()) {
    return <SdkBridge overrides={overrides}>{children}</SdkBridge>;
  }
  return <MockBridge overrides={overrides}>{children}</MockBridge>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCrew(): CrewIntegration {
  return useContext(CrewContext);
}

/** Convenience: returns just the API object. */
export function useCrewApi(): CrewAppApi {
  return useContext(CrewContext).api;
}
