# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI tool (`@lekman/mmd`) that extracts inline Mermaid diagrams from Markdown, renders them to dual light/dark SVGs with shared theme configuration, and injects `<picture>` tags back into Markdown. Distributed via `bunx @lekman/mmd`.

## Commands

All commands use [Task](https://taskfile.dev) (`task`) with Bun as the runtime.

```bash
# Setup
task install          # Install all tools and dependencies (alias: i)

# Development
task lint             # Run Biome linting (alias: l)
task format           # Format code with Biome (alias: fmt)
task typecheck        # TypeScript type checking (alias: tc)
task test             # Run tests with Bun (alias: t)
task test:coverage    # Tests with coverage report (alias: cov)
task quality          # Run all quality checks (alias: q)
task build            # Build CLI bundle (alias: b)

# Single test file
bun test tests/unit/services/extract.test.ts
```

Pre-commit hooks run `lint` and `typecheck` automatically.

## Architecture

This project follows **Clean Architecture** principles for testability and maintainability.

### Directory Structure

```
src/
  domain/             # Business entities, interfaces (inner layer)
  services/           # Application services, use cases
  adapters/           # Renderer and filesystem adapters
  cli/                # Commander CLI entry point and commands
  templates/          # AI skill template files (claude, cursor, copilot)
tests/
  unit/               # Unit tests (mock external dependencies)
  mocks/              # Mock implementations (mock-fs.ts, mock-renderer.ts)
examples/             # Example .mmd files for all diagram types
docs/
  requirements/       # PRD documents
```

**Stack**: Bun runtime, TypeScript (strict mode), Biome (linting/formatting), Husky (pre-commit), Semgrep (security)

### Clean Architecture Principles

1. **Dependency Rule**: Dependencies point inward. Business logic never depends on infrastructure.

2. **Interface-Based Boundaries**: External dependencies accessed through interfaces:
   ```typescript
   // Define interface in domain/
   interface IRenderer {
     readonly supportedTypes: ReadonlySet<DiagramType>;
     render(content: string): Promise<string>;
   }

   // Implement in adapters/
   class BeautifulMermaidRenderer implements IRenderer { ... }
   ```

3. **Dependency Injection**: Use optional `deps` parameter for testability:
   ```typescript
   export async function renderDiagrams(config: ThemeConfig, deps?: {
     renderer?: IRenderer;
     fs?: IFileSystem;
   }) { ... }
   ```

4. **System File Convention**: Files with external I/O use `*.system.ts` suffix and are excluded from coverage:
   - `beautiful-mermaid-renderer.system.ts` - beautiful-mermaid API
   - `mmdc-renderer.system.ts` - mermaid-cli subprocess
   - `filesystem.system.ts` - Node.js file operations

5. **Testability**: Business logic is fully unit-testable with mocks.

## Code Style

- Biome handles formatting and linting (configured in `biome.json`)
- Double quotes, semicolons, ES5 trailing commas
- 100 character line width, 2-space indentation
- Imports organized automatically
- No `console.log` in production code (enforced by semgrep)

## Testing

This project uses **Test-Driven Development (TDD)** with Bun's built-in test runner.

### TDD Workflow

Follow the **Red -> Green -> Refactor** cycle:

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

### Test Organization

| Location | Purpose | Speed |
|----------|---------|-------|
| `tests/unit/` | Business logic with mocks | < 10ms |
| `tests/mocks/` | Mock implementations | N/A |

### Coverage Targets

| Code Type | Target |
|-----------|--------|
| Business logic | 80%+ |
| Validation | 100% |
| System files (`*.system.ts`) | Excluded |
| CLI commands (`src/cli/**`) | Excluded |

## CI Pipeline

GitHub Actions runs on PRs to `main`: lint, typecheck, test (with coverage), security scan. All must pass for merge (quality gate). Release-please automates versioning from conventional commits.

## Task Libraries

Additional task commands available via `@northbridge-security/ai-toolkit`:
- `task git:<command>` - Git operations
- `task json:<command>` - JSON validation
- `task yaml:<command>` - YAML validation (alias: yml)
- `task markdown:<command>` - Markdown validation (alias: md)
- `task security:<command>` - Security tools (alias: s)
