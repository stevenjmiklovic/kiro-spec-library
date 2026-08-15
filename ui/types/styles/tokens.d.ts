/**
 * Design tokens for the Kiro Spec Library UI.
 * Task 15.4 — matches the prototype's visual design.
 */
export declare const darkTheme: {
    readonly canvasBg: "#1a1b1e";
    readonly canvasSurface: "#25262b";
    readonly canvasBorder: "#373a40";
    readonly canvasText: "#c1c2c5";
    readonly canvasTextMuted: "#909296";
    readonly canvasAccent: "#748ffc";
    readonly nodeFeature: "#748ffc";
    readonly nodeBugfix: "#ff6b6b";
    readonly nodeQuick: "#51cf66";
    readonly nodeUnknown: "#868e96";
    readonly stageRequirements: "#fcc419";
    readonly stageDesign: "#748ffc";
    readonly stageTasks: "#ff922b";
    readonly stageCompleted: "#51cf66";
    readonly edgeSolid: "#748ffc";
    readonly edgeDashed: "#495057";
    readonly edgeHighlight: "#a5d8ff";
};
export declare const lightTheme: {
    readonly bg: "#ffffff";
    readonly surface: "#f8f9fa";
    readonly border: "#dee2e6";
    readonly text: "#212529";
    readonly textMuted: "#868e96";
    readonly accent: "#4263eb";
    readonly rowHover: "#f1f3f5";
    readonly rowSelected: "#e7f5ff";
    readonly statusActive: "#51cf66";
    readonly statusHeld: "#fcc419";
    readonly statusPurged: "#868e96";
};
export declare const typography: {
    readonly fontFamily: "\"AWS Diatype\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
    readonly monoFamily: "\"JetBrains Mono\", \"Fira Code\", monospace";
    readonly xs: "0.75rem";
    readonly sm: "0.875rem";
    readonly base: "1rem";
    readonly lg: "1.125rem";
    readonly xl: "1.25rem";
    readonly '2xl': "1.5rem";
    readonly '3xl': "2rem";
};
export declare const spacing: {
    readonly xs: "0.25rem";
    readonly sm: "0.5rem";
    readonly md: "1rem";
    readonly lg: "1.5rem";
    readonly xl: "2rem";
    readonly '2xl': "3rem";
};
export type DarkTheme = typeof darkTheme;
export type LightTheme = typeof lightTheme;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
//# sourceMappingURL=tokens.d.ts.map