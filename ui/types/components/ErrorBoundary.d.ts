import { Component, type ErrorInfo, type ReactNode } from 'react';
interface Props {
    children: ReactNode;
}
interface State {
    error: Error | null;
}
/**
 * Catches render errors anywhere below it so a bug in one view doesn't blank
 * the whole app. React has no hook-based equivalent — error boundaries must
 * be class components (getDerivedStateFromError / componentDidCatch).
 */
export declare class ErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map