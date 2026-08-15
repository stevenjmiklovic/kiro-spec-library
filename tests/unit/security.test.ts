import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validatePath, validatePathSync } from "../../backend/src/security/path-validator.js";
import { validateArgs, buildFetchCommand, buildCloneCommand } from "../../backend/src/security/git-validator.js";

describe("path-validator", () => {
  let testDir: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), "path-validator-test-"));
    // Create some test files
    mkdirSync(join(testDir, "specs", "my-spec"), { recursive: true });
    writeFileSync(join(testDir, "specs", "my-spec", "requirements.md"), "# Test");
    writeFileSync(join(testDir, "small.txt"), "hello");
    // Create a large file (>1MB)
    writeFileSync(join(testDir, "huge.bin"), Buffer.alloc(1_048_577, "x"));
    // Create a symlink escape
    mkdirSync(join(testDir, "links"), { recursive: true });
    symlinkSync("/tmp", join(testDir, "links", "escape"));
    // Create credential path
    mkdirSync(join(testDir, ".kiro", "credentials"), { recursive: true });
    writeFileSync(join(testDir, ".kiro", "credentials", "token"), "secret");
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("traversal rejection", () => {
    test("rejects simple ..", async () => {
      const result = await validatePath("../etc/passwd", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("traversal");
    });

    test("rejects embedded ..", async () => {
      const result = await validatePath("specs/../../etc/passwd", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("traversal");
    });

    test("rejects .. at end", async () => {
      const result = await validatePath("specs/..", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("traversal");
    });
  });

  describe("filesystem root rejection", () => {
    test("rejects /", async () => {
      const result = await validatePath("/", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("root");
    });
  });

  describe("credential path blocking", () => {
    test("rejects .kiro/credentials", async () => {
      const result = await validatePath(".kiro/credentials/token", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("credential");
    });

    test("rejects .kiro/secrets", async () => {
      const result = await validatePath(".kiro/secrets", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("credential");
    });

    test("rejects .credentials", async () => {
      const result = await validatePath(".credentials/key", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("credential");
    });
  });

  describe("symlink escape detection", () => {
    test("rejects symlink pointing outside root", async () => {
      const result = await validatePath("links/escape", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("escape");
    });
  });

  describe("file size check", () => {
    test("rejects oversized file", async () => {
      const result = await validatePath("huge.bin", testDir);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("exceeds maximum size");
    });

    test("accepts normal sized file", async () => {
      const result = await validatePath("small.txt", testDir);
      expect(result.valid).toBe(true);
    });
  });

  describe("valid paths", () => {
    test("accepts normal spec path", async () => {
      const result = await validatePath("specs/my-spec/requirements.md", testDir);
      expect(result.valid).toBe(true);
    });

    test("accepts non-existent path (no size check)", async () => {
      const result = await validatePath("does-not-exist.md", testDir);
      expect(result.valid).toBe(true);
    });
  });

  describe("validatePathSync", () => {
    test("rejects traversal", () => {
      const result = validatePathSync("../escape", testDir);
      expect(result.valid).toBe(false);
    });

    test("accepts normal path", () => {
      const result = validatePathSync("specs/my-spec/requirements.md", testDir);
      expect(result.valid).toBe(true);
    });
  });
});

describe("git-validator", () => {
  describe("validateArgs", () => {
    test("accepts normal args", () => {
      const result = validateArgs(["origin", "main"]);
      expect(result.valid).toBe(true);
    });

    test("rejects --upload-pack", () => {
      const result = validateArgs(["--upload-pack=/bin/sh"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Forbidden");
    });

    test("rejects --exec", () => {
      const result = validateArgs(["--exec=rm -rf /"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Forbidden");
    });

    test("rejects -c", () => {
      const result = validateArgs(["-c", "core.sshCommand=evil"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Forbidden");
    });

    test("rejects --config", () => {
      const result = validateArgs(["--config=protocol.ext.allow=always"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Forbidden");
    });

    test("rejects --hooks-path", () => {
      const result = validateArgs(["--hooks-path=/tmp/hooks"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Forbidden");
    });

    test("rejects shell metacharacter ;", () => {
      const result = validateArgs(["origin; rm -rf /"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("metacharacter");
    });

    test("rejects shell metacharacter |", () => {
      const result = validateArgs(["url | cat /etc/passwd"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("metacharacter");
    });

    test("rejects shell metacharacter $", () => {
      const result = validateArgs(["$(whoami)"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("metacharacter");
    });

    test("rejects backtick", () => {
      const result = validateArgs(["`id`"]);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("metacharacter");
    });
  });

  describe("buildFetchCommand", () => {
    test("returns correct command structure", () => {
      const cmd = buildFetchCommand("/repos/my-clone", "main");
      expect(cmd[0]).toBe("git");
      expect(cmd).toContain("fetch");
      expect(cmd).toContain("--no-tags");
      expect(cmd).toContain("--depth=1");
      expect(cmd).toContain("origin");
      expect(cmd).toContain("main");
      expect(cmd.join(" ")).toContain("core.hooksPath=/dev/null");
    });

    test("throws on invalid args", () => {
      expect(() => buildFetchCommand("/repos/my;clone", "main")).toThrow();
    });
  });

  describe("buildCloneCommand", () => {
    test("returns correct command structure", () => {
      const cmd = buildCloneCommand("https://github.com/org/repo.git", "/tmp/clone", "main");
      expect(cmd[0]).toBe("git");
      expect(cmd).toContain("clone");
      expect(cmd).toContain("--no-tags");
      expect(cmd).toContain("--depth=1");
      expect(cmd).toContain("--single-branch");
      expect(cmd).toContain("main");
      expect(cmd.join(" ")).toContain("core.hooksPath=/dev/null");
    });

    test("throws on shell injection in URL", () => {
      expect(() => buildCloneCommand("https://evil.com/$(whoami)", "/tmp/x", "main")).toThrow();
    });
  });
});
