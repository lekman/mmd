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

See [Architecture](ARCHITECTURE.md) for the full directory structure and Clean Architecture layer rules.

## Task Runner

All commands use [Task](https://taskfile.dev/) with Bun as the runtime.

| Command | Alias | Description |
| ------- | ----- | ----------- |
| `task install` | `i` | Install all tools and dependencies |
| `task lint` | `l` | Run Biome linting |
| `task format` | `fmt` | Format code with Biome |
| `task typecheck` | `tc` | TypeScript type checking |
| `task test` | `t` | Run unit tests with Bun |
| `task test:coverage` | `cov` | Tests with coverage report |
| `task quality` | `q` | Run lint + typecheck + test |
| `task run` | `r` | Run CLI from source |
| `task build` | `b` | Build CLI bundle |
| `task vsix:build` | | Build VSCode extension |
| `task install:vsix` | | Build, package, and install extension locally |

## Development Workflow

This project uses TDD. Follow Red-Green-Refactor. Run `task quality` before committing. Pre-commit hooks enforce lint and typecheck via Husky.

See [Quality Assurance](QA.md) for coverage targets, mock strategy, and test scenarios.

## Pull Request Process

1. Branch from `main` (`feat/`, `fix/`, `docs/`)
2. Follow the code style and testing requirements
3. Run `task quality`
4. Push and open a PR — fill in the template
5. All CI checks must pass (lint, typecheck, test, security)
6. PRs are reviewed by CodeRabbit (automated) and a maintainer

## Code Style

[Biome](https://biomejs.dev/) handles formatting and linting (`biome.json`).

- Double quotes, semicolons, ES5 trailing commas
- 100 character line width, 2-space indentation
- No `console.log` in production code (enforced by Semgrep)

## Commit Messages

[Conventional Commits](https://www.conventionalcommits.org/) for automated versioning.

Format: `<type>(<scope>): <description>`

| Type | Purpose |
| ---- | ------- |
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Maintenance |
| `ci` | CI/CD |

## Release Process

Releases are automated using [release-please](https://github.com/googleapis/release-please). Merge conventional commits to `main` and the pipeline handles versioning, changelog, npm publishing, and VS Code Marketplace publishing.

## Issue Reporting

- **Bugs**: Open a [GitHub issue](https://github.com/lekman/mmd/issues) with steps to reproduce and `bun --version`
- **Features**: Open a [GitHub issue](https://github.com/lekman/mmd/issues) describing the use case
- **Security**: See [Security](SECURITY.md) — do not use public issues
