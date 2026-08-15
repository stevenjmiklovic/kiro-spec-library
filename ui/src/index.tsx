// Load app CSS alongside the module
const cssUrl = new URL('./index.css', import.meta.url).href;
if (!document.querySelector(`link[href="${cssUrl}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
}

export { App as default, App as SpecLibraryApp } from './App.js';
export type { CrewIntegration } from './hooks/useCrewIntegration.js';
export type { UrlState } from './hooks/useUrlState.js';
