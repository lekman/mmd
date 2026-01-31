# Contributing to @lekman/mmd

## Getting Started

1. Fork and clone the repository:

    ```bash
    git clone https://github.com/<your-username>/mmd.git
    cd mmd
    ```

2. Install dependencies:

    ```bash
    brew install oven-sh/bun/bun go-task semgrep
    task install
    ```

3. Verify setup:

    ```bash
    task quality
    ```

## Development Workflow

This project uses Test-Driven Development (TDD). Follow the Red-Green-Refactor cycle:

1. **Red** — Write a failing test that describes the expected behaviour
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Improve the code while keeping tests green

Run the quality gate before committing:

```bash
task quality    # Runs lint + typecheck + test
```

Pre-commit hooks run `lint` and `typecheck` automatically via Husky.

## Pull Request Process

1. Create a feature branch from `main`:

    ```bash
    git checkout -b feat/your-feature
    ```

2. Make your changes following the [code style](#code-style) and [testing requirements](#testing-requirements).

3. Run the quality gate:

    ```bash
    task quality
    ```

4. Push and open a PR against `main`.

5. Fill in the PR template: summary, changes, test plan, related issues.

6. All CI checks must pass before merge:

    | Check | Purpose |
    | ----- | ------- |
    | lint | Biome linting |
    | typecheck | TypeScript type checking |
    | test | Unit tests with coverage |
    | security | Semgrep scan |

7. PRs are reviewed by CodeRabbit (automated) and a maintainer.

## Code Style

[Biome](https://biomejs.dev/) handles formatting and linting. Configuration is in `biome.json`.

- Double quotes, semicolons, ES5 trailing commas
- 100 character line width, 2-space indentation
- Imports organized automatically
- No `console.log` in production code (enforced by Semgrep)

Format and lint:

```bash
task format     # Auto-format
task lint       # Check linting
```

## Testing Requirements

- Business logic requires 80%+ line coverage
- Validation code requires 100% coverage
- System files (`*.system.ts`) and CLI commands (`src/cli/**`) are excluded from coverage
- All tests use mocks for external dependencies (renderer, filesystem)
- No network or subprocess calls in unit tests

Run tests:

```bash
task test              # Run unit tests
task test:coverage     # Tests with coverage report
bun test tests/unit/services/extract.test.ts   # Single file
```

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning via release-please.

Format: `<type>(<scope>): <description>`

| Type | Purpose |
| ---- | ------- |
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance (dependencies, CI config) |
| `ci` | CI/CD pipeline changes |

Examples:

```
feat(render): add mtime-based staleness check
fix(extract): handle nested fenced blocks in markdown
docs: add architecture diagrams to ARCHITECTURE.md
```

## Issue Reporting

### Bug Reports

Open a [GitHub issue](https://github.com/lekman/mmd/issues) with:

- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Mermaid diagram content (if relevant)
- Runtime version (`bun --version`)

### Feature Requests

Open a [GitHub issue](https://github.com/lekman/mmd/issues) describing the use case and proposed solution.

## Security Issues

Do not report security vulnerabilities through public GitHub issues. See [docs/SECURITY.md](docs/SECURITY.md) for the reporting process.
