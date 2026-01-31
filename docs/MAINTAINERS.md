# Maintainers

Development setup, commands, CI/CD pipelines, and release process for @lekman/mmd.

## Primary Contact

| Name | Role | GitHub |
| ---- | ---- | ------ |
| Tobias Lekman | Maintainer | [@lekman](https://github.com/lekman) |

## Repository Structure

```
.
├── src/
│   ├── domain/             # Business entities, interfaces (inner layer)
│   ├── services/           # Application services, use cases
│   ├── adapters/           # Renderer and filesystem adapters
│   ├── cli/                # Commander CLI entry point and commands
│   └── templates/          # AI skill template files (claude, cursor, copilot)
├── tests/
│   ├── unit/               # Unit tests (mock external dependencies)
│   └── mocks/              # Mock implementations (mock-fs.ts, mock-renderer.ts)
├── examples/               # Example .mmd files for all diagram types
├── docs/
│   ├── requirements/       # PRD documents
│   ├── ARCHITECTURE.md     # System design and diagrams
│   ├── MAINTAINERS.md      # This file
│   ├── QA.md               # Test strategy and coverage
│   ├── SECURITY.md         # Security policy and threat model
│   └── CHANGELOG.md        # Auto-generated release history
├── .github/
│   ├── workflows/          # CI/CD pipeline definitions
│   └── dependabot.yml      # Automated dependency updates
├── .mermaid.json           # Theme configuration
├── biome.json              # Linting and formatting config
├── tsconfig.json           # TypeScript config
├── bunfig.toml             # Bun runtime and test config
├── Taskfile.yml            # Task runner definitions
└── package.json            # Package metadata and scripts
```

## Task Runner

All development commands use [Task](https://taskfile.dev/) with Bun as the runtime. Install both:

```bash
brew install oven-sh/bun/bun go-task
```

### Commands

| Command | Alias | Description |
| ------- | ----- | ----------- |
| `task install` | `i` | Install all tools and dependencies |
| `task lint` | `l` | Run Biome linting |
| `task format` | `fmt` | Format code with Biome |
| `task typecheck` | `tc` | TypeScript type checking |
| `task test` | `t` | Run unit tests with Bun |
| `task test:coverage` | `cov` | Tests with coverage report |
| `task quality` | `q` | Run lint + typecheck + test |
| `task build` | `b` | Build CLI bundle |

### Task Libraries

Additional commands are available via `@northbridge-security/ai-toolkit`:

| Namespace | Description |
| --------- | ----------- |
| `task git:<command>` | Git operations |
| `task json:<command>` | JSON validation |
| `task yaml:<command>` | YAML validation |
| `task markdown:<command>` | Markdown validation |
| `task security:<command>` | Security tools (Semgrep) |

## Development Workflow

1. Create a branch from `main`:

    ```bash
    git checkout -b feat/your-feature
    ```

2. Write a failing test (Red):

    ```bash
    bun test tests/unit/services/your-feature.test.ts
    ```

3. Write the minimum code to pass (Green).

4. Refactor while keeping tests green.

5. Run the quality gate:

    ```bash
    task quality
    ```

6. Commit using [Conventional Commits](https://www.conventionalcommits.org/):

    ```bash
    git commit -m "feat(render): add mtime-based staleness check"
    ```

7. Push and open a PR against `main`.

## Running Tests

```bash
task test                                        # All unit tests
task test:coverage                               # With coverage report
bun test tests/unit/services/extract.test.ts     # Single file
```

Tests use mock implementations for external dependencies:

- `tests/mocks/mock-renderer.ts` — returns fixed SVG strings
- `tests/mocks/mock-fs.ts` — operates on in-memory file maps

No network or subprocess calls in unit tests.

## Pre-commit Hooks

Husky runs the following checks before every commit:

```bash
bun run lint && bun run typecheck
```

If either check fails, the commit is rejected. Fix the issues and commit again.

## CI Pipeline

GitHub Actions workflows run on PRs to `main`:

| Workflow | File | Trigger | Purpose |
| -------- | ---- | ------- | ------- |
| CI | `ci.yml` | PR to `main`, push to `main` | Lint, typecheck, test, security scan |
| Release | `release.yml` | Push to `main` | Create release PR via release-please |
| Auto-release | `auto-release.yml` | Release workflow completes | Auto-merge release PRs |
| CD | (on release) | GitHub Release created | Build and publish to npm + GitHub Packages |
| Claude | `claude.yml` | `@claude` mention | Interactive Claude Code agent |
| Code Review | `claude-code-review.yml` | PR open/sync | Automated code review |

### CI Jobs

The CI workflow runs these jobs in parallel:

| Job | Command | Purpose |
| --- | ------- | ------- |
| lint | `biome check src/ tests/` | Code style and lint rules |
| typecheck | `tsc --noEmit` | TypeScript type checking |
| test | `bun test tests/unit/ --coverage` | Unit tests with coverage |
| security | Semgrep scan | `p/security-audit`, `p/secrets`, `p/typescript` |
| quality-gate | (depends on all above) | All checks must pass for merge |

## Quality Gate

Every PR must pass all CI jobs before merging. The `quality-gate` job enforces this as a required status check on `main`.

Locally, run `task quality` to check all gates before pushing.

## Release Process

Releases are automated using [release-please](https://github.com/googleapis/release-please):

1. Merge PRs with conventional commit messages to `main`.
2. Release-please creates a release PR that bumps the version and updates `docs/CHANGELOG.md`.
3. The auto-release workflow merges the release PR after CI passes.
4. A GitHub Release is created, triggering the CD pipeline.
5. CD builds the CLI bundle and publishes to both registries:

    | Registry | URL |
    | -------- | --- |
    | npm | `https://www.npmjs.com/package/@lekman/mmd` |
    | GitHub Packages | `https://npm.pkg.github.com/@lekman/mmd` |

Both publish steps must succeed. If either fails, the workflow fails to prevent version drift.

### Conventional Commit Types

| Type | Section in Changelog | Visible |
| ---- | -------------------- | ------- |
| `feat` | Features | Yes |
| `fix` | Bug Fixes | Yes |
| `perf` | Performance | Yes |
| `docs` | Documentation | Yes |
| `chore` | Maintenance | Hidden |
| `refactor` | Refactoring | Hidden |
| `test` | Tests | Hidden |
| `ci` | CI/CD | Hidden |

## Code Review Tools

| Tool | Trigger | Configuration |
| ---- | ------- | ------------- |
| CodeRabbit | Automatic on PR | `.coderabbit.yml` — Biome, Semgrep, Gitleaks, Markdownlint |
| Claude Code Review | Automatic on PR | `claude-code-review.yml` — skips `release-please--*` branches |
| Claude Code Agent | `@claude` mention | `claude.yml` — interactive issue/PR agent |
| Semgrep | CI pipeline | `.semgrep.yml` — custom rules + cloud rulesets |

## Dependency Updates

[Dependabot](https://docs.github.com/en/code-security/dependabot) is configured in `.github/dependabot.yml`:

| Ecosystem | Schedule | Max PRs | Grouping |
| --------- | -------- | ------- | -------- |
| npm | Weekly | 10 | Dev dependencies grouped by minor/patch |
| GitHub Actions | Weekly | 5 | None |
