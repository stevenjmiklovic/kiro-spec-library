// Registers happy-dom globals (document, window, etc.) so React component and
// hook tests can run under `bun test`. Loaded via bunfig.toml [test].preload.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
