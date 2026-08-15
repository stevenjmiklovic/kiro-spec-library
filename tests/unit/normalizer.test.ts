import { describe, expect, test } from "bun:test";
import {
  deriveKey,
  classifyType,
  classifyWorkflow,
  extractTitle,
  calculateStage,
  calculateProgress,
  countTasks,
} from "../../backend/src/services/normalizer.js";
import type { ArtifactManifest, TaskCounts } from "../../shared/src/types.js";

describe("deriveKey", () => {
  test("with specId returns sourceId::specId", () => {
    expect(deriveKey("source1", "spec1", "path/to/file")).toBe("source1::spec1");
  });

  test("without specId returns sourceId::relativePath", () => {
    expect(deriveKey("source1", null, "path/to/file")).toBe("source1::path/to/file");
  });
});

describe("classifyType", () => {
  test("feature: has requirements.md AND design.md", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true };
    expect(classifyType(files, null)).toBe("feature");
  });

  test("bugfix via config: config.specType=bugfix", () => {
    const files: ArtifactManifest = { "requirements.md": true };
    expect(classifyType(files, { specId: "test", specType: "bugfix" })).toBe("bugfix");
  });

  test("bugfix via artifact: has bugfix.md, no requirements.md", () => {
    const files: ArtifactManifest = { "bugfix.md": true };
    expect(classifyType(files, null)).toBe("bugfix");
  });

  test("quick: has tasks.md only (no design, no requirements)", () => {
    const files: ArtifactManifest = { "tasks.md": true };
    expect(classifyType(files, null)).toBe("quick");
  });

  test("unknown: has only requirements.md (no design)", () => {
    const files: ArtifactManifest = { "requirements.md": true };
    expect(classifyType(files, null)).toBe("unknown");
  });
});

describe("classifyWorkflow", () => {
  test("requirements-first: has requirements.md", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true };
    expect(classifyWorkflow(files)).toBe("requirements-first");
  });

  test("design-first: has design.md but NO requirements.md", () => {
    const files: ArtifactManifest = { "design.md": true };
    expect(classifyWorkflow(files)).toBe("design-first");
  });

  test("unknown: has neither requirements nor design", () => {
    const files: ArtifactManifest = { "tasks.md": true };
    expect(classifyWorkflow(files)).toBe("unknown");
  });
});

describe("extractTitle", () => {
  test("H1 present: extracts title from heading", () => {
    expect(extractTitle("# My Feature Spec\n\nBody", "fallback-slug")).toBe("My Feature Spec");
  });

  test("H1 absent: slug converted to title", () => {
    expect(extractTitle("no heading here", "my-cool-feature")).toBe("My Cool Feature");
  });

  test("fallback slug conversion", () => {
    expect(extractTitle("no heading", "my-cool-feature")).toBe("My Cool Feature");
  });

  test("empty/undefined content: uses slug title", () => {
    expect(extractTitle(undefined, "my-cool-feature")).toBe("My Cool Feature");
  });
});

describe("calculateStage", () => {
  test("completed: has tasks.md, all tasks done", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 5, completed: 5 };
    expect(calculateStage(files, tc)).toBe("done");
  });

  test("tasks in progress: has tasks.md, some completed", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 5, completed: 2 };
    expect(calculateStage(files, tc)).toBe("in-flight");
  });

  test("design only: has design.md, no tasks", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateStage(files, tc)).toBe("scoped");
  });

  test("bug analysis: has bugfix.md, no requirements, no design", () => {
    const files: ArtifactManifest = { "bugfix.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateStage(files, tc)).toBe("scoped");
  });

  test("requirements only: has requirements.md", () => {
    const files: ArtifactManifest = { "requirements.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateStage(files, tc)).toBe("new");
  });

  test("tasks with zero checkboxes", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateStage(files, tc)).toBe("refined");
  });
});

describe("calculateProgress", () => {
  test("only requirements: 33", () => {
    const files: ArtifactManifest = { "requirements.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateProgress(files, tc)).toBe(33);
  });

  test("requirements + design: 66", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateProgress(files, tc)).toBe(66);
  });

  test("requirements + design + tasks (5/10): 83", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 10, completed: 5 };
    expect(calculateProgress(files, tc)).toBe(83);
  });

  test("requirements + design + tasks (10/10): 100", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 10, completed: 10 };
    expect(calculateProgress(files, tc)).toBe(100);
  });

  test("requirements + design + tasks (0/10): 66", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 10, completed: 0 };
    expect(calculateProgress(files, tc)).toBe(66);
  });

  test("tasks.md with zero checkboxes (has requirements + design): 66", () => {
    const files: ArtifactManifest = { "requirements.md": true, "design.md": true, "tasks.md": true };
    const tc: TaskCounts = { total: 0, completed: 0 };
    expect(calculateProgress(files, tc)).toBe(66);
  });

  test("only tasks.md (quick spec): floor(34 * completed/total)", () => {
    const files: ArtifactManifest = { "tasks.md": true };
    const tc: TaskCounts = { total: 4, completed: 2 };
    // No requirements (0) + no design (0) + floor(34 * 2/4) = floor(17) = 17
    expect(calculateProgress(files, tc)).toBe(17);
  });
});

describe("countTasks", () => {
  test("normal: mixed checkboxes", () => {
    const content = "- [x] done\n- [ ] todo\n- [~] partial";
    expect(countTasks(content)).toEqual({ total: 3, completed: 1 });
  });

  test("all done", () => {
    const content = "- [x] a\n- [x] b";
    expect(countTasks(content)).toEqual({ total: 2, completed: 2 });
  });

  test("no checkboxes", () => {
    const content = "no checkboxes here";
    expect(countTasks(content)).toEqual({ total: 0, completed: 0 });
  });

  test("empty/undefined content", () => {
    expect(countTasks(undefined)).toEqual({ total: 0, completed: 0 });
  });

  test("nested checkboxes", () => {
    const content = "  - [x] sub\n  - [ ] sub2";
    expect(countTasks(content)).toEqual({ total: 2, completed: 1 });
  });

  test("mixed content with checkboxes", () => {
    const content = "text\n- [x] item\nmore text\n- [ ] another";
    expect(countTasks(content)).toEqual({ total: 2, completed: 1 });
  });

  test("capital X not counted (only lowercase x matches)", () => {
    const content = "- [X] item";
    expect(countTasks(content)).toEqual({ total: 0, completed: 0 });
  });
});
