import { type ReactNode } from 'react';
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
    open(context?: {
        specId?: string;
        revisionId?: string;
        prompt?: string;
        agent?: string;
    }): void;
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
export interface CrewProviderProps {
    children: ReactNode;
    overrides?: Partial<CrewIntegration>;
}
export declare function CrewProvider({ children, overrides }: CrewProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCrew(): CrewIntegration;
/** Convenience: returns just the API object. */
export declare function useCrewApi(): CrewAppApi;
//# sourceMappingURL=useCrewIntegration.d.ts.map