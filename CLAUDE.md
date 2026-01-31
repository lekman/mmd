# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is also used by the automated code review workflow (`claude-code-review.yml`).

## Project Overview

CLI tool (`@lekman/mmd`) that extracts inline Mermaid diagrams from Markdown, renders them to themed SVGs using a configurable light/dark mode, and injects standard markdown image tags back into Markdown. Distributed via `bunx @lekman/mmd`.

## Commands

All commands use [Task](https://taskfile.dev) (`task`) with Bun as the runtime.

```bash
task install          # Install all tools and dependencies (alias: i)
task lint             # Run Biome linting (alias: l)
task format           # Format code with Biome (alias: fmt)
task typecheck        # TypeScript type checking (alias: tc)
task test             # Run tests with Bun (alias: t)
task test:coverage    # Tests with coverage report (alias: cov)
task quality          # Run all quality checks (alias: q)
task run              # Run CLI sync from source (alias: r)
task build            # Build CLI bundle (alias: b)

# Single test file
bun test tests/unit/services/extract.test.ts
```

Pre-commit hooks run `lint` and `typecheck` automatically.

Additional task commands via `@northbridge-security/ai-toolkit`:
- `task git:<command>` — Git operations
- `task json:<command>` — JSON validation
- `task yaml:<command>` — YAML validation
- `task markdown:<command>` — Markdown validation
- `task security:<command>` — Security tools (Semgrep)

## Architecture Rules

This project follows Clean Architecture. These rules are enforced in code review.

### Layer Boundaries

```
src/
  domain/       → MUST NOT import from services/, adapters/, cli/
  services/     → MAY import from domain/ only, MUST NOT import from adapters/ or cli/
  adapters/     → MAY import from domain/ only (implements interfaces)
  cli/          → MAY import from services/ and adapters/ (wiring layer)
```

Violations of this dependency rule must be rejected in review.

### File Placement Rules

| New code type | Location | Test location |
|---------------|----------|---------------|
| Type, interface, validation, enum | `src/domain/` | `tests/unit/domain/` |
| Business logic, orchestration | `src/services/` | `tests/unit/services/` |
| External I/O (fs, renderer, network) | `src/adapters/*.system.ts` | Excluded from coverage |
| CLI command | `src/cli/commands/` | Excluded from coverage |
| Shared CLI wiring (factories) | `src/cli/shared.ts` | N/A |
| AI skill template | `src/templates/` | N/A |
| Mock implementation | `tests/mocks/` | N/A |

### System File Convention

Files with external I/O MUST use the `*.system.ts` suffix. These are excluded from coverage in `bunfig.toml`. Current system files:

- `adapters/beautiful-mermaid-renderer.system.ts` — beautiful-mermaid API
- `adapters/mmdc-renderer.system.ts` — mermaid-cli subprocess
- `adapters/filesystem.system.ts` — Node.js file operations

### Dependency Injection Pattern

Services MUST accept dependencies through an options/deps object for testability. Do not instantiate adapters inside service functions.

```typescript
// Correct: dependencies injected
export async function renderDiagrams(
  config: ThemeConfig,
  options: RenderOptions   // contains renderer, fallbackRenderer, fs, mmdFiles, force
): Promise<RenderResult[]> { ... }

// Wrong: adapter instantiated inside service
export async function renderDiagrams(config: ThemeConfig) {
  const renderer = new BeautifulMermaidRenderer(); // VIOLATION
}
```

Production wiring happens in `src/cli/shared.ts` via factory functions (`createFs()`, `createRenderer()`, `createFallbackRenderer()`).

### Interface Definitions

All external dependency interfaces live in `src/domain/interfaces.ts`:

| Interface | Purpose | Implementations |
|-----------|---------|-----------------|
| `IRenderer` | Render `.mmd` content to SVG string | `BeautifulMermaidRenderer`, `MmdcRenderer` |
| `IFileSystem` | Read/write/delete files, check mtimes, glob | `NodeFileSystem` (prod), mock (test) |
| `IExtractor` | Parse Markdown, extract Mermaid blocks | `RegexExtractor` |
| `IInjector` | Replace anchors with markdown image tags | `ImageTagInjector` |

New external dependencies MUST be accessed through an interface in `domain/interfaces.ts`.

### Domain Types

All shared types live in `src/domain/types.ts`:

| Type | Purpose |
|------|---------|
| `DiagramType` | Union of supported diagram types + `"unknown"` |
| `MermaidBlock` | Extracted fenced block with content, source file, line range, name |
| `ThemeMode` | Theme mode selection: `"light"` or `"dark"` |
| `ThemeConfig` | Parsed `.mermaid.json` with mode, themes, and renderer preference |
| `ThemeDef` | Theme definition for a single mode |
| `RenderResult` | Output paths from rendering (source, SVG) |
| `AnchorRef` | Parsed `<!-- mmd:name -->` comment with position |

### Adding a New CLI Command

1. Create `src/cli/commands/<name>.ts` with a `Command` export
2. Register it in `src/cli/index.ts` via `program.addCommand()`
3. Use `createFs()`, `createRenderer()`, etc. from `shared.ts` for adapter wiring
4. Service logic MUST NOT live in the command file — delegate to `src/services/`
5. `console.log`/`console.warn` in CLI commands requires the biome-ignore comment:
   ```typescript
   // biome-ignore lint/suspicious/noConsole: CLI output
   console.log(`  extracted: ${mmdPath}`);
   ```

## Code Style Rules

Biome enforces formatting and linting (configured in `biome.json`). These rules are non-negotiable:

- Double quotes, semicolons, ES5 trailing commas
- 100 character line width, 2-space indentation
- Imports organized automatically by Biome
- `noUnusedVariables`: error
- `noExplicitAny`: warn (off in tests)
- `noConsole`: warn (off in tests)
- `noNonNullAssertion`: off in tests only

### Console Output

- `console.log` is forbidden in `src/` (enforced by Semgrep and Biome)
- Exception: `src/cli/**` may use `console.log` with the biome-ignore directive
- Tests may use `console.log` freely

### Export Patterns

- Service functions are exported as named functions, not classes
- Domain types use `export type` or `export interface`
- Constants use `export const` with `ReadonlySet`, `ReadonlyArray` where applicable
- CLI commands export a `Command` instance (e.g., `export const extractCommand`)

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `beautiful-mermaid-renderer.system.ts` |
| Interfaces | `I` prefix + PascalCase | `IRenderer`, `IFileSystem` |
| Types | PascalCase | `DiagramType`, `ThemeConfig` |
| Functions | camelCase | `extractMermaidBlocks`, `renderDiagrams` |
| Constants | UPPER_SNAKE_CASE | `BEAUTIFUL_MERMAID_TYPES`, `DIAGRAM_PATTERNS` |
| Regex constants | UPPER_SNAKE_CASE + `_RE` suffix | `ANCHOR_RE`, `MERMAID_FENCE_RE` |
| Options types | PascalCase + `Options` | `RenderOptions`, `SyncOptions` |
| Result types | PascalCase + `Result` | `RenderResult`, `SyncResult` |

## Testing Rules

This project uses Test-Driven Development (TDD) with Bun's built-in test runner.

### TDD Workflow

Follow the **Red -> Green -> Refactor** cycle:

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

Every new service function or domain function MUST have a corresponding test file.

### Coverage Thresholds

Enforced in `bunfig.toml` — CI fails if these drop:

| Metric | Threshold |
|--------|-----------|
| Line | 80% |
| Statement | 80% |
| Function | 60% |

Coverage exclusions:
- `src/cli/**` — argument parsing
- `**/*.system.ts` — external I/O
- `src/services/init.ts` — initialization/setup logic
- `tests/**` — test files

### Test File Rules

- Test files MUST mirror the source path: `src/services/extract.ts` → `tests/unit/services/extract.test.ts`
- Tests MUST use mocks for `IRenderer` and `IFileSystem` — no real filesystem or renderer calls
- Tests MUST NOT make network calls or spawn subprocesses
- Use `describe()` blocks to group related tests
- Use `test()` (not `it()`) for individual test cases
- Import from `bun:test`: `describe`, `expect`, `test`, `beforeEach`, `mock`

### Mock Implementations

Shared mocks live in `tests/mocks/`:

- `mock-fs.ts` — in-memory `IFileSystem` with a `Map<string, string>` backing store
- `mock-renderer.ts` — returns fixed SVG strings, tracks calls

Tests MUST use these shared mocks (or create inline mocks following the same pattern). Do not use real adapters in unit tests.

### What to Test

| Service | Key scenarios |
|---------|--------------|
| extract | Find blocks, zero blocks, multiple blocks, name generation, anchor replacement |
| render | Single-mode theme, mtime staleness skip (source + config), `--force`, fallback renderer routing, old file cleanup |
| inject | Markdown image tag generation, relative paths, multiple anchors, no-op when no anchors, backward compat with old `<picture>` blocks |
| sync | Pipeline order (extract → render → inject), `--force` passthrough |
| check | Orphaned blocks in anchored files, ignore unmanaged files |
| init | AI tool detection, path resolution, `--force`, `--global` scope limits |

## Security Rules

- No secrets, API keys, or credentials in source code (enforced by Semgrep: `no-secrets-in-code`, `no-hardcoded-credentials`)
- No `console.log` in production code outside `src/cli/` (enforced by Semgrep: `no-console-log-in-production`)
- File writes MUST be scoped to the configured `outputDir` or known config paths
- No network calls during extract, render, inject, sync, or check operations
- Template files in `src/templates/` are static content only — no dynamic code generation

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/). Release-please uses these to generate changelogs and version bumps.

Format: `<type>(<scope>): <description>`

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance (deps, config) |
| `ci` | CI/CD pipeline changes |

## CI Quality Gate

All checks MUST pass before merge to `main`:

| Check | Tool | Criteria |
|-------|------|----------|
| Lint | Biome | Zero errors |
| Typecheck | `tsc --noEmit` | Zero errors |
| Tests | Bun test runner | All pass, coverage thresholds met |
| Security | Semgrep | Zero findings (`p/security-audit`, `p/secrets`, `p/typescript`) |

## Documentation

| Document | Content |
|----------|---------|
| [Architecture](docs/ARCHITECTURE.md) | C4 diagrams, Clean Architecture layers, data flow |
| [Contributing](docs/CONTRIBUTING.md) | Dev setup, task commands, CI/CD, release process, PR conventions |
| [QA](docs/QA.md) | Test strategy, TDD workflow, coverage targets |
| [Security](docs/SECURITY.md) | Vulnerability reporting, threat model |
