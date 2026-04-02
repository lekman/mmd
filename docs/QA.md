# Quality Assurance

Test strategy, TDD workflow, and coverage targets for @lekman/mmd.

## Test Organization

| Location | Purpose |
| -------- | ------- |
| `tests/unit/domain/` | Type validation, diagram detection |
| `tests/unit/services/` | Service orchestration with mocks |
| `tests/mocks/` | Shared mock implementations (IRenderer, IFileSystem) |

## Coverage Targets

| Code Type | Target | Rationale |
| --------- | ------ | --------- |
| Domain (types, validation) | 100% | Core business rules |
| Services (extract, render, inject, sync, convert, check) | 80%+ | Orchestration logic |
| System files (`*.system.ts`) | Excluded | External I/O |
| CLI commands (`src/cli/**`) | Excluded | Argument parsing |

Coverage is configured in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = { line = 80, function = 60, statement = 80 }
```

## TDD Workflow

Follow Red-Green-Refactor strictly. One failing test at a time.

1. **Red** — Write a failing test for the next smallest piece of behaviour
2. **Green** — Write the minimum code to make it pass
3. **Refactor** — Improve structure while keeping tests green

## Mocking Strategy

External dependencies use interfaces from `src/domain/interfaces.ts`. Tests inject mock implementations from `tests/mocks/`:

- `mock-renderer.ts` — returns fixed SVG strings, tracks render calls
- `mock-fs.ts` — in-memory `Map<string, string>` backing store

Rules: no network calls, no subprocess calls, no real filesystem access in unit tests.

## Quality Gate

Every PR must pass all checks. Run `task quality` locally.

| Check | Passing Criteria |
| ----- | ---------------- |
| Lint (Biome) | Zero errors |
| Typecheck (`tsc --noEmit`) | Zero errors |
| Tests (Bun) | All pass, coverage thresholds met |
| Security (Semgrep) | Zero findings |

## Key Test Scenarios

| Service | Scenarios |
| ------- | --------- |
| extract | Find blocks, zero blocks, multiple blocks, name generation, anchor collision avoidance |
| render | Single-mode theme, mtime staleness, `--force`, fallback routing, old file cleanup, SVG post-processing |
| inject | Image tag generation, relative paths, multiple anchors, backward compat with `<picture>` blocks |
| sync | Pipeline order (extract-render-inject), `--force` passthrough |
| convert | All blocks, single block by index, out-of-range, skip existing `.mmd`, relative paths |
| svg-post-process | Background rect, viewBox expansion, border/radius, custom options, no viewBox fallback |
| check | Orphaned blocks in anchored files, ignore unmanaged files |
| init | AI tool detection, path resolution, `--force`, `--global`, gitignore overrides |
