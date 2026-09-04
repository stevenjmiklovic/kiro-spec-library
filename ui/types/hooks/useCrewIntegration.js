import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
function wrapGatewayApi(_gatewayApi) {
    return {
        async fetch(path, init) {
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
const mockTheme = {
    mode: 'light',
    colors: {
        primary: '#002D72',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#1a1a1a',
        border: '#e0e0e0',
    },
};
const mockApi = {
    async fetch(path, init) {
        const ports = [9102, 9150, 3100];
        for (const port of ports) {
            try {
                const res = await globalThis.fetch(`http://127.0.0.1:${port}/api${path}`, init);
                return res;
            }
            catch {
                continue;
            }
        }
        throw new Error('Backend not reachable on any dev port');
    },
};
const mockNotify = {
    success: (msg) => console.info(`[SpecLibrary] ✓ ${msg}`),
    error: (msg) => console.error(`[SpecLibrary] ✗ ${msg}`),
    info: (msg) => console.info(`[SpecLibrary] ℹ ${msg}`),
};
const mockNavigate = (path) => {
    window.location.href = path;
};
function buildChatLauncher(navigate) {
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
function hasSdk() {
    return !!globalThis.__kirocrew_modules?.['@kirocrew/app-sdk'];
}
function getSdkModule() {
    return globalThis.__kirocrew_modules?.['@kirocrew/app-sdk'] ?? null;
}
// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const defaultIntegration = {
    theme: mockTheme,
    api: mockApi,
    notify: mockNotify,
    navigate: mockNavigate,
    chatLauncher: buildChatLauncher(mockNavigate),
    ready: true,
};
const CrewContext = createContext(defaultIntegration);
/**
 * Internal component that calls the gateway SDK hooks.
 * Separated so we can conditionally render it only when the SDK exists.
 */
function SdkBridge({ children, overrides }) {
    // These are React hooks from the gateway SDK — safe to call here
    // because this component only renders when the SDK is available.
    const sdk = getSdkModule();
    const gatewayApi = sdk.useAppApi();
    const theme = sdk.useTheme?.() ?? mockTheme;
    const navigate = sdk.useNavigate?.() ?? mockNavigate;
    const notify = sdk.useNotify?.() ?? mockNotify;
    const chatLauncher = (() => {
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
    const integration = useMemo(() => {
        const base = { theme, api, notify, navigate, chatLauncher, ready: true };
        return overrides ? { ...base, ...overrides } : base;
    }, [theme, api, notify, navigate, chatLauncher, overrides]);
    return (_jsx(CrewContext.Provider, { value: integration, children: children }));
}
/**
 * Standalone fallback — no SDK, uses mock implementations for dev mode.
 */
function MockBridge({ children, overrides }) {
    const integration = useMemo(() => {
        return overrides ? { ...defaultIntegration, ...overrides } : defaultIntegration;
    }, [overrides]);
    return (_jsx(CrewContext.Provider, { value: integration, children: children }));
}
export function CrewProvider({ children, overrides }) {
    if (hasSdk()) {
        return _jsx(SdkBridge, { overrides: overrides, children: children });
    }
    return _jsx(MockBridge, { overrides: overrides, children: children });
}
// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useCrew() {
    return useContext(CrewContext);
}
/** Convenience: returns just the API object. */
export function useCrewApi() {
    return useContext(CrewContext).api;
}
