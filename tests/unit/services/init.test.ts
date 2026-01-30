import { describe, expect, test } from "bun:test";
import { detectAiTools, getInstallPaths } from "../../../src/services/init.ts";
import { MockFileSystem } from "../../mocks/mock-fs.ts";

describe("detectAiTools", () => {
  test("detects Claude Code when .claude/ exists", async () => {
    const fs = new MockFileSystem();
    fs.setFile(".claude/settings.json", "{}");
    const tools = await detectAiTools(fs);
    expect(tools).toContain("claude");
  });

  test("detects Claude Code when CLAUDE.md exists", async () => {
    const fs = new MockFileSystem();
    fs.setFile("CLAUDE.md", "# Claude");
    const tools = await detectAiTools(fs);
    expect(tools).toContain("claude");
  });

  test("detects Cursor when .cursor/ exists", async () => {
    const fs = new MockFileSystem();
    fs.setFile(".cursor/settings.json", "{}");
    const tools = await detectAiTools(fs);
    expect(tools).toContain("cursor");
  });

  test("detects Copilot when .github/ exists", async () => {
    const fs = new MockFileSystem();
    fs.setFile(".github/workflows/ci.yml", "on: push");
    const tools = await detectAiTools(fs);
    expect(tools).toContain("copilot");
  });

  test("returns empty array when no AI tools detected", async () => {
    const fs = new MockFileSystem();
    const tools = await detectAiTools(fs);
    expect(tools).toHaveLength(0);
  });
});

describe("getInstallPaths", () => {
  test("returns project-scope paths for claude", () => {
    const paths = getInstallPaths("claude", false);
    expect(paths).toBe(".claude/skills/mermaid/SKILL.md");
  });

  test("returns project-scope paths for cursor", () => {
    const paths = getInstallPaths("cursor", false);
    expect(paths).toBe(".cursor/rules/mermaid.mdc");
  });

  test("returns project-scope paths for copilot", () => {
    const paths = getInstallPaths("copilot", false);
    expect(paths).toBe(".github/instructions/mermaid.instructions.md");
  });

  test("returns global path for claude", () => {
    const paths = getInstallPaths("claude", true);
    expect(paths).toContain(".claude/skills/mermaid/SKILL.md");
  });

  test("returns null for cursor in global mode", () => {
    const paths = getInstallPaths("cursor", true);
    expect(paths).toBeNull();
  });

  test("returns null for copilot in global mode", () => {
    const paths = getInstallPaths("copilot", true);
    expect(paths).toBeNull();
  });
});
