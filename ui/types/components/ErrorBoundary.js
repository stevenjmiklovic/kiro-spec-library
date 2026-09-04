import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
/**
 * Catches render errors anywhere below it so a bug in one view doesn't blank
 * the whole app. React has no hook-based equivalent — error boundaries must
 * be class components (getDerivedStateFromError / componentDidCatch).
 */
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
    }
    render() {
        if (this.state.error) {
            return (_jsxs("div", { role: "alert", className: "error-boundary", children: [_jsx("h2", { children: "Something went wrong" }), _jsx("p", { children: this.state.error.message })] }));
        }
        return this.props.children;
    }
}
