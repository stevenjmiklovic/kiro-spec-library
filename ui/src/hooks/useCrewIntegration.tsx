import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Interfaces – locally defined since @kirocrew/app-sdk resolves at runtime
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
// Mock implementations (dev mode / standalone)
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
    // Direct backend fallback when gateway SDK isn't available
    const baseUrl = `http://127.0.0.1:9150/api`;
    return globalThis.fetch(`${baseUrl}${path}`, init);
  },
};

const mockNotify: CrewNotify = {
  success: (msg) => console.info(`[CrewIntegration/mock] ✓ ${msg}`),
  error: (msg) => console.error(`[CrewIntegration/mock] ✗ ${msg}`),
  info: (msg) => console.info(`[CrewIntegration/mock] ℹ ${msg}`),
};

const mockNavigate: CrewNavigate = (path) => {
  console.warn(`[CrewIntegration/mock] navigate → ${path}`);
};

/**
 * Build a chatLauncher that uses the provided navigate function for SPA-friendly
 * routing. Used when the gateway SDK doesn't provide a dedicated useChatLauncher.
 */
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

const defaultIntegration: CrewIntegration = {
  theme: mockTheme,
  api: mockApi,
  notify: mockNotify,
  navigate: mockNavigate,
  chatLauncher: buildChatLauncher(mockNavigate),
  ready: true,
  error: undefined,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CrewContext = createContext<CrewIntegration>(defaultIntegration);

// ---------------------------------------------------------------------------
// Runtime bridge – attempt to resolve real Crew SDK hooks
// ---------------------------------------------------------------------------

interface CrewWindow {
  __CREW_SDK__?: {
    useTheme?: () => CrewTheme;
    useApi?: () => CrewAppApi;
    useNotify?: () => CrewNotify;
    useNavigate?: () => CrewNavigate;
    useChatLauncher?: () => CrewChatLauncher;
  };
}

function resolveCrewSdk(): CrewIntegration {
  try {
    const crewSdk = (globalThis as unknown as CrewWindow).__CREW_SDK__;
    if (!crewSdk) {
      return { ...defaultIntegration, error: undefined }; // dev mode – mocks
    }

    const theme = crewSdk.useTheme?.() ?? mockTheme;
    const api = crewSdk.useApi?.() ?? mockApi;
    const notify = crewSdk.useNotify?.() ?? mockNotify;
    const navigate = crewSdk.useNavigate?.() ?? mockNavigate;
    const chatLauncher = crewSdk.useChatLauncher?.() ?? buildChatLauncher(navigate);

    return { theme, api, notify, navigate, chatLauncher, ready: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[CrewIntegration] SDK resolution failed:', message);
    return { ...defaultIntegration, ready: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface CrewProviderProps {
  children: ReactNode;
  /** Override any part of the integration (useful for tests / Storybook). */
  overrides?: Partial<CrewIntegration>;
}

export function CrewProvider({ children, overrides }: CrewProviderProps) {
  const [integration, setIntegration] = useState<CrewIntegration>(() => {
    const resolved = resolveCrewSdk();
    return overrides ? { ...resolved, ...overrides } : resolved;
  });

  useEffect(() => {
    // Re-resolve if SDK becomes available after initial render (lazy injection)
    const resolved = resolveCrewSdk();
    const merged = overrides ? { ...resolved, ...overrides } : resolved;
    setIntegration(merged);
  }, [overrides]);

  return <CrewContext.Provider value={integration}>{children}</CrewContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Full Crew integration object. */
export function useCrew(): CrewIntegration {
  return useContext(CrewContext);
}

/** Shortcut – Crew API client. */
export function useCrewApi(): CrewAppApi {
  return useContext(CrewContext).api;
}

/** Shortcut – Crew theme (mode + color tokens). */
export function useCrewTheme(): CrewTheme {
  return useContext(CrewContext).theme;
}
