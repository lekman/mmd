# Quality Assurance

Test strategy, TDD workflow, and coverage targets for @lekman/mmd.

## Test Philosophy

All business logic is developed using Test-Driven Development (TDD). Tests describe the expected behaviour before the implementation exists. External dependencies (filesystem, renderers) are always mocked in unit tests.

## Test Organization

| Location | Purpose | Speed |
| -------- | ------- | ----- |
| `tests/unit/` | Business logic with mocks | < 10ms per test |
| `tests/unit/domain/` | Type validation, diagram detection | No dependencies |
| `tests/unit/services/` | Service orchestration | Mock renderer, mock filesystem |
| `tests/mocks/` | Shared mock implementations | N/A |

## Coverage Targets

| Code Type | Target | Rationale |
| --------- | ------ | --------- |
| Domain (types, validation) | 100% | Core business rules must be fully verified |
| Services (extract, render, inject, check, sync, init) | 80%+ | Orchestration logic with branching paths |
| System files (`*.system.ts`) | Excluded | External I/O — tested through integration |
| CLI commands (`src/cli/**`) | Excluded | Argument parsing — tested through end-to-end usage |

Coverage is configured in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = { line = 80, function = 60, statement = 80 }
coverageSkipTestFiles = true
```

## TDD Workflow

### 1. Red — Write a Failing Test

```typescript
import { describe, expect, test } from "bun:test";
import { extractMermaidBlocks } from "../../../src/services/extract.ts";

describe("extractMermaidBlocks", () => {
  test("finds fenced mermaid block in markdown", () => {
    const md = "# Title\n\n```mermaid\nflowchart TD\n  A --> B\n```\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe("flowchart TD\n  A --> B");
  });

  test("returns empty array when no mermaid blocks exist", () => {
    const md = "# Title\n\nNo diagrams here.\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    expect(blocks).toHaveLength(0);
  });
});
```

Run the test and confirm it fails:

```bash
bun test tests/unit/services/extract.test.ts
```

### 2. Green — Write Minimum Code

Write only the code needed to pass the failing test. No extra features, no premature abstractions.

### 3. Refactor — Improve While Green

Improve code structure, naming, and readability. Run the test after each change to confirm it still passes.

## Mocking Strategy

External dependencies are accessed through interfaces defined in `src/domain/interfaces.ts`. Tests inject mock implementations:

### IRenderer Mock

Returns fixed SVG strings without invoking any renderer binary:

```typescript
const mockRenderer: IRenderer = {
  supportedTypes: new Set(["flowchart", "sequence", "class", "state", "er"]),
  render: async (content: string) => `<svg>${content}</svg>`,
};
```

### IFileSystem Mock

Operates on an in-memory file map:

```typescript
const mockFs: IFileSystem = {
  files: new Map<string, string>(),
  readFile: async (path) => mockFs.files.get(path) ?? "",
  writeFile: async (path, content) => { mockFs.files.set(path, content); },
  exists: async (path) => mockFs.files.has(path),
  mtime: async (path) => Date.now(),
  glob: async (pattern, cwd) => [...mockFs.files.keys()],
  mkdir: async () => {},
};
```

### Rules

- No network calls in unit tests
- No subprocess calls in unit tests
- No real filesystem access in unit tests
- All external I/O goes through injected interfaces

## Running Tests

```bash
task test                                        # All unit tests
task test:coverage                               # With coverage report
bun test tests/unit/services/extract.test.ts     # Single file
```

## Quality Gate

Every PR must pass all checks before merge. The CI `quality-gate` job enforces this.

| Check | Tool | Passing Criteria |
| ----- | ---- | ---------------- |
| Lint | Biome | Zero errors |
| Type check | TypeScript (`tsc --noEmit`) | Zero errors |
| Unit tests | Bun test runner | All tests pass |
| Coverage | Bun coverage | Line 80%, function 60%, statement 80% |
| Security | Semgrep | Zero findings in `p/security-audit`, `p/secrets` |

Run all checks locally:

```bash
task quality
```

## Key Test Scenarios

### Extract Service

- Finds fenced mermaid blocks in markdown
- Handles zero blocks (returns empty array)
- Handles multiple blocks per file
- Generates names from file path and block index
- Replaces blocks with anchor comments

### Render Service

- Renders single `*.svg` using selected theme mode (light or dark)
- Skips up-to-date SVGs (mtime comparison on `.mmd` and `.mermaid.json`)
- Re-renders all with `--force`
- Re-renders when config changes (mode switch, theme edits)
- Falls back to mmdc for unsupported diagram types
- Cleans up old `*.light.svg` / `*.dark.svg` files

### Inject Service

- Generates standard markdown image tags: `![Alt](path/name.svg)`
- Computes relative paths from the `.md` file to the SVG
- Handles nested directory structures
- Replaces old `<picture>` blocks on next inject/sync
- Leaves files unchanged when no anchors exist

### Sync Service

- Runs extract, render, inject in order
- Passes `--force` flag through to render
- Reports counts of extracted and rendered diagrams

### Check Service

- Detects orphaned inline Mermaid blocks in files that have anchors
- Ignores files without anchor comments
- Returns warnings with file path and line number

### Init Service

- Detects installed AI tools (Claude, Cursor, Copilot)
- Copies rule files to correct paths
- Skips existing files without `--force`
- Warns on `--global` for tools that don't support it
- Adds VS Code extension recommendation
