import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
// ---------------------------------------------------------------------------
// Mock implementations (dev mode / standalone)
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
        // Direct backend fallback when gateway SDK isn't available
        const baseUrl = `http://127.0.0.1:9150/api`;
        return globalThis.fetch(`${baseUrl}${path}`, init);
    },
};
const mockNotify = {
    success: (msg) => console.info(`[CrewIntegration/mock] ✓ ${msg}`),
    error: (msg) => console.error(`[CrewIntegration/mock] ✗ ${msg}`),
    info: (msg) => console.info(`[CrewIntegration/mock] ℹ ${msg}`),
};
const mockNavigate = (path) => {
    console.warn(`[CrewIntegration/mock] navigate → ${path}`);
};
const mockChatLauncher = {
    open: (ctx) => {
        // In standalone/dev mode, navigate to the dashboard chat with the prompt.
        const prompt = ctx?.prompt ?? `Discuss spec ${ctx?.specId ?? 'unknown'}`;
        const encoded = encodeURIComponent(prompt);
        const agentParam = ctx?.agent ? `&agent=${encodeURIComponent(ctx.agent)}` : '';
        window.location.href = `/chat?prompt=${encoded}${agentParam}`;
    },
};
const defaultIntegration = {
    theme: mockTheme,
    api: mockApi,
    notify: mockNotify,
    navigate: mockNavigate,
    chatLauncher: mockChatLauncher,
    ready: true,
    error: undefined,
};
// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const CrewContext = createContext(defaultIntegration);
function resolveCrewSdk() {
    try {
        const crewSdk = globalThis.__CREW_SDK__;
        if (!crewSdk) {
            return { ...defaultIntegration, error: undefined }; // dev mode – mocks
        }
        const theme = crewSdk.useTheme?.() ?? mockTheme;
        const api = crewSdk.useApi?.() ?? mockApi;
        const notify = crewSdk.useNotify?.() ?? mockNotify;
        const navigate = crewSdk.useNavigate?.() ?? mockNavigate;
        const chatLauncher = crewSdk.useChatLauncher?.() ?? mockChatLauncher;
        return { theme, api, notify, navigate, chatLauncher, ready: true };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[CrewIntegration] SDK resolution failed:', message);
        return { ...defaultIntegration, ready: false, error: message };
    }
}
export function CrewProvider({ children, overrides }) {
    const [integration, setIntegration] = useState(() => {
        const resolved = resolveCrewSdk();
        return overrides ? { ...resolved, ...overrides } : resolved;
    });
    useEffect(() => {
        // Re-resolve if SDK becomes available after initial render (lazy injection)
        const resolved = resolveCrewSdk();
        const merged = overrides ? { ...resolved, ...overrides } : resolved;
        setIntegration(merged);
    }, [overrides]);
    return _jsx(CrewContext.Provider, { value: integration, children: children });
}
// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
/** Full Crew integration object. */
export function useCrew() {
    return useContext(CrewContext);
}
/** Shortcut – Crew API client. */
export function useCrewApi() {
    return useContext(CrewContext).api;
}
/** Shortcut – Crew theme (mode + color tokens). */
export function useCrewTheme() {
    return useContext(CrewContext).theme;
}
