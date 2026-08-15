/**
 * Design tokens for the Kiro Spec Library UI.
 * Task 15.4 — matches the prototype's visual design.
 */

export const darkTheme = {
  // Graphite canvas (Relationship View)
  canvasBg: '#1a1b1e',
  canvasSurface: '#25262b',
  canvasBorder: '#373a40',
  canvasText: '#c1c2c5',
  canvasTextMuted: '#909296',
  canvasAccent: '#748ffc',

  // Node colors by type
  nodeFeature: '#748ffc',
  nodeBugfix: '#ff6b6b',
  nodeQuick: '#51cf66',
  nodeUnknown: '#868e96',

  // Stage indicators
  stageRequirements: '#fcc419',
  stageDesign: '#748ffc',
  stageTasks: '#ff922b',
  stageCompleted: '#51cf66',

  // Edge colors
  edgeSolid: '#748ffc',
  edgeDashed: '#495057',
  edgeHighlight: '#a5d8ff',
} as const;

export const lightTheme = {
  // Archive Ledger (Archive View)
  bg: '#ffffff',
  surface: '#f8f9fa',
  border: '#dee2e6',
  text: '#212529',
  textMuted: '#868e96',
  accent: '#4263eb',

  // Table rows
  rowHover: '#f1f3f5',
  rowSelected: '#e7f5ff',

  // Status
  statusActive: '#51cf66',
  statusHeld: '#fcc419',
  statusPurged: '#868e96',
} as const;

export const typography = {
  fontFamily:
    '"AWS Diatype", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  monoFamily: '"JetBrains Mono", "Fira Code", monospace',
  // Sizes
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export type DarkTheme = typeof darkTheme;
export type LightTheme = typeof lightTheme;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
