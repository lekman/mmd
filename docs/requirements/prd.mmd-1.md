---
version: 0.1.0
status: approved
ticket: MMD-1
---

# PRD: @lekman/mmd — Mermaid Diagram Management CLI

## Vision Statement

Provide a single CLI command (`bunx @lekman/mmd sync`) that eliminates manual Mermaid theming hacks across repositories, producing GitHub-native dark/light SVG diagrams from standard `.mmd` source files with zero configuration.

## User Personas

### Developer (Primary)
- Writes documentation in Markdown with architecture diagrams
- Uses GitHub for code review and collaboration
- Wants diagrams to render correctly in both dark and light GitHub themes
- Does not want to maintain `%%{init}` theme overrides in every diagram

### Technical Writer
- Maintains project documentation across multiple repos
- Needs consistent diagram styling that matches the project's visual identity
- Wants a build step that produces ready-to-commit SVGs without manual export

### AI Coding Assistant User
- Uses Claude Code, Cursor, or GitHub Copilot for development
- Expects AI tools to understand the Mermaid workflow and `.mmd` file conventions
- Benefits from installed rule files that teach AI assistants the tool's patterns

## Overview

A cross-repo CLI tool (`bunx @lekman/mmd`) that extracts inline Mermaid diagram blocks from Markdown files, renders them to SVG with a shared theme configuration, and injects image references back into the Markdown. Supports dual dark/light theme rendering with GitHub `<picture>` tag output.

## Problem Statement

Mermaid diagrams in Markdown render differently depending on the viewer's theme (dark/light). GitHub renders Mermaid server-side with no user control over theming, leading to:

- Hardcoded `%%{init}` theme overrides in every diagram block
- `<div style="background: white">` hacks to force readable backgrounds
- Diagrams that look acceptable in one mode but broken in the other
- No shared theme configuration across diagrams or repositories

## Goals

- Extract inline Mermaid blocks from `.md` files into standalone `.mmd` files
- Render `.mmd` files to `.svg` using a shared theme config (`.mermaid.json`)
- Generate dual dark/light SVG variants per diagram
- Inject `<picture>` tags with `prefers-color-scheme` media queries into source `.md` files
- Distribute as a `bunx`-executable npm package usable across any repo
- Support the five diagram types covered by beautiful-mermaid: flowchart, state, sequence, class, ER (plus all mmdc-supported types via fallback)
- Ship AI coding assistant rule files for Claude Code, Cursor, and GitHub Copilot

## Non-Goals

- Replacing Mermaid syntax — `.mmd` files use standard Mermaid syntax
- Live preview / dev server — use VS Code Mermaid extension for local preview
- Editing diagrams through the CLI — it is a build tool, not an editor
- Supporting all Mermaid diagram types at launch (see Risks)

## Repository Setup

The repository `lekman/mmd` must mirror the tooling, CI/CD, and quality standards of the reference repo at `lekman/rag`. Where details are not specified below, refer to the corresponding files in that repo.

**Reference repo path:** `/Users/tobiaslekman/Repo/lekman/rag`

### GitHub Repository

- **Name:** `lekman/mmd`
- **Visibility:** Public
- **License:** MIT
- **Default branch:** `main`
- **Branch protection:** Require CI quality gate to pass before merge

### Runtime and Package Manager

| Tool | Version |
|------|---------|
| Runtime | Bun (latest) |
| Language | TypeScript (strict mode) |
| Package manager | Bun (`bun.lock`) |

### Package Configuration

**package.json:**

```json
{
  "name": "@lekman/mmd",
  "version": "0.0.0",
  "license": "MIT",
  "type": "module",
  "bin": {
    "mmd": "./dist/cli.js"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/lekman/mmd.git"
  },
  "scripts": {
    "start": "bun run src/cli/index.ts",
    "lint": "biome check src/ tests/",
    "lint:fix": "biome check --fix src/ tests/",
    "format": "biome format --write src/ tests/",
    "typecheck": "tsc --noEmit",
    "test": "bun test tests/unit/",
    "test:coverage": "bun test tests/unit/ --coverage",
    "prepare": "husky"
  }
}
```

**.npmrc** (dual registry):

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
@lekman:registry=https://npm.pkg.github.com
```

### Linting and Formatting (Biome)

Mirror `lekman/rag/biome.json`:
- 2-space indentation, 100 char line width
- Double quotes, semicolons, ES5 trailing commas
- `noExplicitAny`: warn, `noConsole`: warn (off in tests), `noUnusedVariables`: error
- Exclude: `node_modules`, `dist`, `build`, `coverage`, `.tmp`, `.claude`

Reference: `lekman/rag/biome.json`

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "Preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "types": ["bun-types"]
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

Reference: `lekman/rag/tsconfig.json`

### Bun Test Configuration

**bunfig.toml:**

```toml
[install]
prefer-offline = true

[test]
coverage = true
coverageThreshold = { line = 80, function = 60, statement = 80 }
coverageSkipTestFiles = true
```

Exclude from coverage: `src/cli/**` (CLI argument parsing), `**/*.system.ts` (external I/O).

Reference: `lekman/rag/bunfig.toml`

### Task Runner (Taskfile)

**Taskfile.yml** with aliases matching `lekman/rag`:

| Command | Alias | Description |
|---------|-------|-------------|
| `task install` | `i` | Install dependencies |
| `task lint` | `l` | Run Biome linting |
| `task format` | `fmt` | Format code |
| `task typecheck` | `tc` | TypeScript type check |
| `task test` | `t` | Run unit tests |
| `task test:coverage` | `cov` | Tests with coverage |
| `task quality` | `q` | Run lint + typecheck + test |
| `task security:scan` | `s:s` | Run Semgrep |
| `task build` | `b` | Bundle CLI for distribution |

Include `@northbridge-security/ai-toolkit` task libraries for git, json, yaml, markdown, and security tasks.

Reference: `lekman/rag/Taskfile.yml`

### Pre-commit Hooks (Husky)

**.husky/pre-commit:**

```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$PATH"
bun run lint && bun run typecheck
```

Reference: `lekman/rag/.husky/pre-commit`

### Turbo (optional caching)

**turbo.json** for caching lint, typecheck, and test runs:

```json
{
  "tasks": {
    "lint": { "inputs": ["src/**", "tests/**", "biome.json"] },
    "typecheck": { "inputs": ["src/**", "tests/**", "tsconfig.json"] },
    "test": { "inputs": ["src/**", "tests/unit/**", "bunfig.toml"] },
    "test:coverage": { "outputs": ["coverage/**"] }
  }
}
```

Reference: `lekman/rag/turbo.json`

### CI/CD: GitHub Actions Workflows

#### 1. ci.yml — Continuous Integration

Triggers: PR to `main` (opened, synchronize, reopened) + push to `main`.

Jobs (all run in parallel where possible):

| Job | Purpose |
|-----|---------|
| **lint** | Biome linting |
| **typecheck** | TypeScript type check |
| **test** | Unit tests with coverage, upload to Codecov |
| **security** | Semgrep scan (`p/security-audit`, `p/secrets`, `p/typescript`) |
| **quality-gate** | Enforces all above pass before merge |

Each job: checkout → setup Bun → `bun install --frozen-lockfile` → run check.

Required secrets: `CODECOV_TOKEN`

Reference: `lekman/rag/.github/workflows/ci.yml` (use the lint/typecheck/test/security/quality-gate jobs; omit the infra/Pulumi/Azure-specific jobs)

#### 2. cd.yml — Continuous Deployment (Publish)

Triggers: release-please creates a GitHub Release on `main`.

Jobs:

| Job | Purpose |
|-----|---------|
| **build** | Bundle CLI with Bun |
| **publish-npm** | `npm publish --access public` to npmjs.org |
| **publish-ghp** | `npm publish --registry https://npm.pkg.github.com` to GitHub Packages |

Required secrets: `NPM_TOKEN`, `GITHUB_TOKEN` (automatic)

Both publish steps must succeed — fail the workflow if either fails. This prevents version drift between registries.

#### 3. release.yml — Automated Versioning (Release Please)

Mirror `lekman/rag/.github/workflows/release.yml` exactly:

- Uses `googleapis/release-please-action@v4`
- Config: `release-please-config.json` + `.release-please-manifest.json`
- Uses GitHub App token (`RELEASE_BOT_APP_ID` + `RELEASE_BOT_PRIVATE_KEY`) to allow release PRs to trigger CI

**release-please-config.json:**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "package-name": "@lekman/mmd",
      "release-type": "node",
      "changelog-path": "docs/CHANGELOG.md"
    }
  },
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance" },
    { "type": "docs", "section": "Documentation" },
    { "type": "chore", "section": "Maintenance", "hidden": true },
    { "type": "refactor", "section": "Refactoring", "hidden": true },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "ci", "section": "CI/CD", "hidden": true }
  ]
}
```

Reference: `lekman/rag/release-please-config.json`

#### 4. auto-release.yml — Auto-merge Release PRs

Mirror `lekman/rag/.github/workflows/auto-release.yml` exactly:

- Triggered when Release workflow completes on `main`
- Finds PR with `autorelease: pending` label
- Validates only version bump files changed (`package.json`, `docs/CHANGELOG.md`, `.release-please-manifest.json`)
- Approves with `GITHUB_TOKEN`, merges with App token (two-actor branch protection)

Reference: `lekman/rag/.github/workflows/auto-release.yml`

#### 5. claude.yml — Interactive Claude Code Agent

Mirror `lekman/rag/.github/workflows/claude.yml`:

- Triggered by `@claude` mentions in issues/PRs
- Uses `anthropics/claude-code-action@v1`
- Required secret: `CLAUDE_CODE_OAUTH_TOKEN`

Reference: `lekman/rag/.github/workflows/claude.yml`

#### 6. claude-code-review.yml — Automated Code Review

Mirror `lekman/rag/.github/workflows/claude-code-review.yml`:

- Triggered on PR open/synchronize/reopen
- Skips `release-please--*` branches
- Uses Claude Code with `code-review` plugin
- Required secret: `CLAUDE_CODE_OAUTH_TOKEN`

Reference: `lekman/rag/.github/workflows/claude-code-review.yml`

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `CODECOV_TOKEN` | Coverage upload to Codecov |
| `NPM_TOKEN` | Publish to npmjs.org |
| `RELEASE_BOT_APP_ID` | GitHub App ID for release-please |
| `RELEASE_BOT_PRIVATE_KEY` | GitHub App private key (PEM) |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code Action authentication |

### SAST and Code Review

#### Semgrep

**.semgrep.yml** with custom rules:
- `no-secrets-in-code` — detect passwords, API keys
- `no-hardcoded-credentials` — detect hardcoded credentials
- `no-console-log-in-production` — warn on `console.log` (exclude tests)

CI uses cloud rulesets: `p/security-audit`, `p/secrets`, `p/typescript`

Reference: `lekman/rag/.semgrep.yml`

#### CodeRabbit

**.coderabbit.yml:**

```yaml
language: en-GB
tone_instructions: >-
  Keep language short and concise. No comedy, poetry or long-winded discussions.
  No "opinions", stick to facts. Focus on technical accuracy.
early_access: true
reviews:
  profile: chill
  auto_apply_labels: true
  poem: false
  auto_review:
    drafts: true
  finishing_touches:
    unit_tests:
      enabled: false
  path_filters:
    - "!**/node_modules/**"
    - "!**/dist/**"
    - "!**/bun.lock"
    - "!**/coverage/**"
  tools:
    actionlint:
      enabled: true
    biome:
      enabled: true
    gitleaks:
      enabled: true
    markdownlint:
      enabled: true
    semgrep:
      enabled: true
    languagetool:
      enabled: true
      level: default
      disabled_categories:
        - TYPOS
        - TYPOGRAPHY
        - CASING
      disabled_rules:
        - EN_UNPAIRED_BRACKETS
        - EN_UNPAIRED_QUOTES
        - MORFOLOGIK_RULE_EN_GB
        - MORFOLOGIK_RULE_EN_US
        - EN_COMPOUNDS
knowledge_base:
  code_guidelines:
    filePatterns:
      - "**/CLAUDE.md"
      - "**/docs/guides/*"
      - "**/docs/standards/*"
```

Reference: `lekman/rag/.coderabbit.yml`

#### Dependabot

**.github/dependabot.yml:**
- npm updates: weekly, max 10 PRs, group dev dependencies
- GitHub Actions updates: weekly, max 5 PRs

Reference: `lekman/rag/.github/dependabot.yml`

### Claude Code Project Configuration

**CLAUDE.md** at repo root with:
- Project overview (what @lekman/mmd does)
- Commands (task aliases)
- Architecture (Clean Architecture directory structure)
- Code style (Biome config summary)
- Testing (TDD workflow, coverage targets)
- CI pipeline description

Reference: `lekman/rag/CLAUDE.md` for structure and tone

**.claude/settings.json** for permission configuration.

### Git Configuration

**.gitignore** (mirror `lekman/rag/.gitignore`):
- `node_modules/`, `dist/`, `build/`, `coverage/`, `.tmp/`, `.turbo/`
- `.env`, `.env.*` (except `.env.example`)
- `*.log`, `.DS_Store`
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` (Bun uses `bun.lock`)

**.github/pull_request_template.md** — Summary, Changes, Test Plan, Related Issues sections with checklist.

Reference: `lekman/rag/.github/pull_request_template.md`

### Acceptance Criteria (Repository Setup)

28. Repository created at `github.com/lekman/mmd` with MIT license
29. CI pipeline runs lint, typecheck, test, security scan with quality gate
30. Release-please creates versioned releases from conventional commits
31. CD publishes to both npm and GitHub Packages on release
32. Auto-release workflow merges release PRs after CI passes
33. CodeRabbit and Claude Code review enabled on PRs
34. Husky pre-commit runs lint + typecheck
35. Dependabot configured for npm and GitHub Actions updates
36. CLAUDE.md documents project for AI-assisted development
37. All config files match patterns from `lekman/rag` reference repo

## Technical Requirements

### CLI Commands

| Command | Description |
|---------|-------------|
| `mmd init` | Install AI coding assistant rule files (Claude, Cursor, Copilot) |
| `mmd extract` | Scan `.md` files, extract Mermaid blocks to `docs/mmd/*.mmd` |
| `mmd render` | Render stale `docs/mmd/*.mmd` to `docs/mmd/*.svg` using `.mermaid.json` (mtime comparison) |
| `mmd render --force` | Re-render all diagrams regardless of timestamps |
| `mmd inject` | Replace anchor comments in `.md` files with `<picture>` image refs |
| `mmd sync` | Run extract + render + inject in sequence |
| `mmd check` | Lint: warn on inline Mermaid blocks in managed `.md` files |

### Workflow Triggers

The tool supports two workflows depending on how the user edits diagrams:

**Flow 1: User adds a Mermaid block to a `.md` file**

```
User edits .md file → adds ```mermaid block
  ↓
mmd sync (or mmd extract + render + inject)
  ↓
1. Extract: fenced block → docs/mmd/<name>.mmd
2. Render: .mmd → .light.svg + .dark.svg
3. Inject: replace fenced block with <!-- mmd:name --> + <picture> tag
```

**Flow 2: User edits an existing `.mmd` file directly**

```
User edits docs/mmd/<name>.mmd
  ↓
mmd render (or mmd sync)
  ↓
Compare .mmd mtime vs .svg mtime
  ↓
If .mmd is newer than .svg → re-render light + dark SVGs
If .svg is newer → skip (already up to date)
```

The `render` command uses file modification timestamps to avoid unnecessary re-renders. An `.mmd` file is re-rendered only when its mtime is newer than the corresponding `.light.svg` and `.dark.svg` files. Use `mmd render --force` to re-render all diagrams regardless of timestamps.

### Anchor Convention

Each extracted block is identified by an HTML comment anchor in the source `.md` file:

```markdown
<!-- mmd:system-context -->
![System Context](docs/mmd/system-context.svg)
```

During `extract`, the tool:
1. Finds fenced ` ```mermaid ` blocks in `.md` files
2. Prompts for (or auto-generates) a diagram name based on file path and block index (e.g., `architecture-0`)
3. Writes the block content to `docs/mmd/<name>.mmd`
4. Replaces the fenced block with an anchor comment + `<picture>` tag

During `inject`, the tool reads anchor comments and regenerates `<picture>` tags from rendered SVGs.

### Theme Configuration (`.mermaid.json`)

Placed in the repo root. Defines shared theme variables for all diagrams. The default themes match GitHub's light and dark color palettes so rendered SVGs blend with GitHub's UI in both modes:

```json
{
  "outputDir": "docs/mmd",
  "themes": {
    "light": {
      "theme": "base",
      "themeVariables": {
        "background": "#ffffff",
        "primaryColor": "#ddf4ff",
        "primaryTextColor": "#1f2328",
        "primaryBorderColor": "#218bff",
        "lineColor": "#656d76",
        "secondaryColor": "#dafbe1",
        "tertiaryColor": "#fff8c5",
        "noteBkgColor": "#f6f8fa",
        "noteTextColor": "#1f2328",
        "fontSize": "14px"
      }
    },
    "dark": {
      "theme": "base",
      "themeVariables": {
        "background": "#0d1117",
        "primaryColor": "#1f3a5f",
        "primaryTextColor": "#e6edf3",
        "primaryBorderColor": "#58a6ff",
        "lineColor": "#8b949e",
        "secondaryColor": "#1a3d2e",
        "tertiaryColor": "#3d2e00",
        "noteBkgColor": "#161b22",
        "noteTextColor": "#e6edf3",
        "fontSize": "14px"
      }
    }
  },
  "renderer": "beautiful-mermaid",
  "fallbackRenderer": "mmdc"
}
```

### Rendering Pipeline

1. Read `.mermaid.json` from the repo root (or nearest parent)
2. For each `.mmd` file in `outputDir`:
   a. Prepend the `light` theme as `%%{init: ...}%%`
   b. Render to `<name>.light.svg`
   c. Prepend the `dark` theme as `%%{init: ...}%%`
   d. Render to `<name>.dark.svg`
3. Output SVGs alongside `.mmd` files in `outputDir`

### Injected Markdown Output

The `inject` command produces:

```html
<!-- mmd:system-context -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/mmd/system-context.dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/mmd/system-context.light.svg">
  <img alt="System Context" src="docs/mmd/system-context.light.svg">
</picture>
```

`srcset` paths are relative to the `.md` file that contains the anchor.

### Renderer Architecture

The primary renderer is **beautiful-mermaid** (zero-DOM, TypeScript-native). A fallback to **mmdc** (mermaid-cli, Puppeteer-based) activates for diagram types that beautiful-mermaid does not support.

```
IRenderer
├── BeautifulMermaidRenderer  (flowchart, state, sequence, class, ER)
└── MmdcRenderer              (C4, gantt, pie, gitgraph, mindmap, etc.)
```

Diagram type is detected by parsing the first non-comment line of the `.mmd` file (e.g., `C4Context`, `flowchart TD`, `sequenceDiagram`).

### File Structure (generated)

```
repo/
  .mermaid.json              # Theme configuration
  docs/
    ARCHITECTURE.md          # Contains <!-- mmd:xxx --> anchors + <picture> tags
    mmd/
      system-context.mmd     # Source diagram
      system-context.light.svg
      system-context.dark.svg
      container-view.mmd
      container-view.light.svg
      container-view.dark.svg
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Bun |
| Language | TypeScript (strict) |
| CLI framework | `citty` or `commander` |
| Primary renderer | beautiful-mermaid |
| Fallback renderer | @mermaid-js/mermaid-cli (mmdc) |
| Markdown parsing | regex on fenced code blocks (no full AST needed) |
| Package registries | npm (npmjs.com) + GitHub Packages (npm.pkg.github.com) |
| CI/CD | GitHub Actions |

## Core Features

### Must Have (P0)

1. **Extract** — Scan `.md` files, extract fenced Mermaid blocks to `docs/mmd/*.mmd`, replace with anchor comments
2. **Render** — Render `.mmd` files to dual `*.light.svg` + `*.dark.svg` using `.mermaid.json` theme config; mtime-based staleness check
3. **Inject** — Replace anchor comments in `.md` files with `<picture>` tags containing `prefers-color-scheme` media queries
4. **Sync** — Orchestrate extract → render → inject in a single command
5. **Check** — Lint `.md` files for orphaned inline Mermaid blocks in managed files
6. **Theme Config** — `.mermaid.json` at repo root defining shared light/dark theme variables
7. **Dual Renderer** — beautiful-mermaid as primary renderer with mmdc fallback for unsupported diagram types

### Should Have (P1)

8. **Init** — Install AI coding assistant rule files (Claude Code, Cursor, GitHub Copilot) into consuming repos
9. **Force Render** — `--force` flag to re-render all diagrams regardless of timestamps
10. **VS Code Integration** — `mmd init` adds extension recommendation for Mermaid Chart extension

### Nice to Have (P2)

11. **Global Init** — `--global` flag to install Claude Code skill to user-level path
12. **Example Files** — Ship example `.mmd` files covering all supported diagram types

## Acceptance Criteria

1. `mmd extract` finds all ` ```mermaid ` blocks in `.md` files and writes `.mmd` files
2. `mmd extract` replaces fenced blocks with anchor comments in the source `.md`
3. `mmd render` produces `*.light.svg` and `*.dark.svg` for each `.mmd` file
4. `mmd render` reads theme variables from `.mermaid.json`
5. `mmd render` uses beautiful-mermaid for supported types and falls back to mmdc for others
6. `mmd inject` generates valid `<picture>` tags with correct relative `srcset` paths
7. `mmd sync` runs the full pipeline without manual steps
8. `mmd check` reports inline Mermaid blocks in files that already have anchors
9. SVGs render correctly on GitHub in both dark and light mode
10. The tool runs via `bunx @lekman/mmd` without global installation
11. `.mmd` files use standard Mermaid syntax with no tool-specific extensions

Package distribution, CD pipeline, and package.json configuration are defined in the [Repository Setup](#repository-setup) section above.

## AI Coding Assistant Integration

The package ships rule/skill files that teach AI coding assistants Mermaid best practices, the `@lekman/mmd` workflow, and diagram authoring guidelines. These files are installed into consuming repos via `mmd init`, which copies the appropriate files for each detected AI tool.

### Shipped Files

| AI Tool | File Path | Format |
|---------|-----------|--------|
| Claude Code | `.claude/skills/mermaid/SKILL.md` | Markdown with YAML frontmatter |
| Cursor | `.cursor/rules/mermaid.mdc` | MDC (YAML frontmatter + Markdown) |
| GitHub Copilot | `.github/instructions/mermaid.instructions.md` | Markdown with YAML frontmatter |

### Init Command

```bash
mmd init              # Detect AI tools present, install matching rule files (project scope)
mmd init --global     # Install to global/user-level paths (applies to all repos)
mmd init --all        # Install all rule files regardless of detection
mmd init --claude     # Install only Claude Code skill
mmd init --cursor     # Install only Cursor rule
mmd init --copilot    # Install only GitHub Copilot instructions
mmd init --force      # Overwrite existing rule files
```

### Install Scopes

| Scope | Flag | Description |
|-------|------|-------------|
| Project (default) | (none) | Install into the current repo's config directories |
| Global | `--global` | Install into user-level config directories (all repos) |

#### Project-scope paths (default)

| AI Tool | Path |
|---------|------|
| Claude Code | `.claude/skills/mermaid/SKILL.md` |
| Cursor | `.cursor/rules/mermaid.mdc` |
| GitHub Copilot | `.github/instructions/mermaid.instructions.md` |

#### Global-scope paths (`--global`)

| AI Tool | Path | Notes |
|---------|------|-------|
| Claude Code | `~/.claude/skills/mermaid/SKILL.md` | User-level skill, applies to all projects |
| Cursor | Not supported | Cursor rules are project-scoped only |
| GitHub Copilot | Not supported | Copilot instructions are repo-scoped only |

When `--global` is used with `--cursor` or `--copilot`, the tool warns that global install is not supported for that tool and skips it.

### Detection Logic (project scope)

- Claude Code: `.claude/` directory or `CLAUDE.md` exists
- Cursor: `.cursor/` directory or `.cursorrules` exists
- GitHub Copilot: `.github/` directory exists

In `--global` mode, detection is skipped — the tool installs directly to the user home path.

### Shared Content

All three files deliver the same knowledge, adapted to each tool's format and conventions. The content covers:

#### 1. Mermaid Syntax Best Practices

- Supported diagram types and when to use each
- Node and edge naming conventions (use descriptive IDs, not single letters)
- Subgraph organization for readability
- Direction selection guidance (TD for hierarchies, LR for flows, etc.)
- C4 diagram conventions (C4Context, C4Container, C4Component)
- Avoiding common syntax errors (missing semicolons, unquoted labels with special chars)

#### 2. @lekman/mmd Tool Usage

- `.mermaid.json` configuration reference
- CLI commands and workflow (`mmd sync`, `mmd extract`, `mmd render`, `mmd inject`, `mmd check`)
- Anchor comment convention (`<!-- mmd:name -->`)
- When to run `mmd sync` (after editing `.mmd` files)
- File structure: `.mmd` source files live in `docs/mmd/`, SVGs are generated artifacts

#### 3. Authoring Guidelines

- Write `.mmd` files, not inline Mermaid in Markdown
- Do not edit generated SVGs or `<picture>` tags manually
- Do not add `%%{init}` theme directives — the tool handles theming
- Keep diagrams focused: one concept per diagram
- Use the anchor comment to give diagrams meaningful names
- Commit both `.mmd` source files and generated `.svg` files

### Claude Code Skill Format

```markdown
---
name: mermaid
description: Mermaid diagram best practices and @lekman/mmd tool usage. Use when creating, editing, or reviewing Mermaid diagrams, .mmd files, or diagram-related Markdown.
user-invocable: false
---

<!-- This skill follows the Agent Skills open standard: https://agentskills.io -->

# Mermaid Diagram Guidelines

## Tool Workflow
...

## Syntax Best Practices
...

## Authoring Rules
...
```

Key properties:
- `user-invocable: false` — Claude auto-invokes when working with `.mmd` or diagram-related files
- Stored in `.claude/skills/mermaid/SKILL.md`

### Cursor Rule Format

```markdown
---
description: Mermaid diagram best practices and @lekman/mmd tool usage
globs: "*.mmd,*.md"
alwaysApply: false
---

# Mermaid Diagram Guidelines

## Tool Workflow
...

## Syntax Best Practices
...

## Authoring Rules
...
```

Key properties:
- `globs` triggers the rule when editing `.mmd` or `.md` files
- `alwaysApply: false` — only loaded when glob matches
- Stored in `.cursor/rules/mermaid.mdc`

### GitHub Copilot Instructions Format

```markdown
---
applyTo: "**/*.mmd,**/*.md,docs/**"
---

# Mermaid Diagram Guidelines

## Tool Workflow
...

## Syntax Best Practices
...

## Authoring Rules
...
```

Key properties:
- `applyTo` glob restricts to diagram and documentation files
- Stored in `.github/instructions/mermaid.instructions.md`
- ~4,000 character limit — content must be concise

### Template Storage

Rule templates are bundled in the package at `src/templates/`:

```
src/templates/
  claude-skill.md       # Claude Code SKILL.md template
  cursor-rule.mdc       # Cursor .mdc template
  copilot-instructions.md  # GitHub Copilot template
```

`mmd init` copies these to the correct paths in the consuming repo, creating parent directories as needed. Existing files are not overwritten unless `--force` is passed.

### Acceptance Criteria (AI Skills)

12. `mmd init` detects installed AI tools and copies matching rule files
13. `mmd init` does not overwrite existing rule files without `--force`
14. `mmd init --global` installs Claude Code skill to `~/.claude/skills/mermaid/SKILL.md`
15. `mmd init --global` warns and skips Cursor/Copilot (no global scope for those tools)
16. Claude Code skill is auto-invoked when editing `.mmd` files
17. Cursor rule activates on `.mmd` and `.md` file edits
18. Copilot instructions apply to `**/*.mmd` and `docs/**` paths
19. All three rule files contain the same Mermaid knowledge, adapted to each format
20. GitHub Copilot instructions fit within the ~4,000 character guideline

## Architecture & Design

Clean Architecture with dependencies pointing inward. See [Development Methodology](#development-methodology) section for full directory layout.

### Domain Model

| Entity | Description |
|--------|-------------|
| `MermaidBlock` | Extracted fenced code block with content, source file, line range, and generated name |
| `ThemeConfig` | Parsed `.mermaid.json` with light/dark theme variables and renderer preference |
| `RenderResult` | Output of rendering: light SVG path, dark SVG path, source `.mmd` path |
| `AnchorRef` | Parsed `<!-- mmd:name -->` comment with diagram name and position in source file |
| `DiagramType` | Enum of supported diagram types (flowchart, sequence, class, etc.) with renderer mapping |

### Interface Boundaries

| Interface | Purpose | Implementations |
|-----------|---------|-----------------|
| `IRenderer` | Render `.mmd` content to SVG string | `BeautifulMermaidRenderer`, `MmdcRenderer` |
| `IFileSystem` | Read/write files, check mtimes | `NodeFileSystem` (production), `MemoryFileSystem` (test) |
| `IExtractor` | Parse Markdown and extract Mermaid blocks | `RegexExtractor` |
| `IInjector` | Replace anchors with `<picture>` tags | `PictureTagInjector` |

## Security Considerations

- No network access required during normal operation (all rendering is local)
- No secrets or credentials handled by the tool
- File operations are scoped to the current repository and output directory
- `mmd init --global` writes to `~/.claude/skills/` only — no other user-level paths modified
- Template files are bundled static content, not dynamically generated — no injection risk

## Test Strategy

### Approach
Test-Driven Development (Red-Green-Refactor) for all service and domain code.

### Test Layers

| Layer | Scope | Dependencies | Coverage Target |
|-------|-------|-------------|-----------------|
| Domain (types, validation) | Type guards, diagram type detection, config validation | None | 100% |
| Services (extract, render, inject, check, sync) | Business logic orchestration | Mock renderer, mock filesystem | 80%+ |
| Adapters (`*.system.ts`) | External I/O (filesystem, renderer binaries) | Real dependencies | Excluded from coverage |
| CLI (`src/cli/`) | Argument parsing, command routing | N/A | Excluded from coverage |

### Key Test Scenarios

- Extract: finds fenced blocks, handles zero blocks, handles multiple blocks per file, generates names from file path
- Render: applies light/dark themes, skips up-to-date SVGs, re-renders with `--force`, falls back to mmdc for unsupported types
- Inject: generates valid `<picture>` tags, computes relative srcset paths, handles nested directory structures
- Sync: runs extract → render → inject in order
- Check: detects orphaned inline blocks, ignores files without anchors
- Init: detects AI tools, copies rule files, respects `--force`, warns on global scope for unsupported tools

### Mocking Strategy
- `IRenderer` mock returns fixed SVG strings
- `IFileSystem` mock operates on in-memory file maps
- No network or subprocess calls in unit tests

## Development Methodology

### Test-Driven Development (TDD)

All custom code follows the Red-Green-Refactor cycle:

1. **RED**: Write a failing test that describes the expected behavior
2. **GREEN**: Write the minimum code to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

```typescript
import { describe, expect, test } from "bun:test";

describe("extractMermaidBlocks", () => {
  test("should find fenced mermaid block in markdown", () => {
    const md = "# Title\n\n```mermaid\nflowchart TD\n  A --> B\n```\n";
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe("flowchart TD\n  A --> B");
  });

  test("should return empty array when no mermaid blocks exist", () => {
    const md = "# Title\n\nNo diagrams here.\n";
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(0);
  });
});
```

### Clean Architecture

The codebase follows Clean Architecture with dependencies pointing inward:

```
src/
  domain/             # Interfaces, types, business rules (inner layer)
    types.ts          # MermaidBlock, ThemeConfig, RenderResult
    interfaces.ts     # IRenderer, IExtractor, IInjector
  services/           # Use cases, orchestration
    extract.ts        # Extract mermaid blocks from markdown
    render.ts         # Render .mmd files to SVG
    inject.ts         # Inject <picture> tags into markdown
    sync.ts           # Orchestrate extract → render → inject
    check.ts          # Lint for orphaned inline blocks
    init.ts           # Install AI skill files
  adapters/           # External dependency implementations
    beautiful-mermaid-renderer.ts
    mmdc-renderer.ts
    filesystem.ts
  cli/                # CLI entry point, argument parsing
    index.ts
    commands/
tests/
  unit/               # Business logic with mocks
  mocks/              # Mock implementations (mock-renderer.ts, etc.)
```

**Key rules:**
- `domain/` has zero external imports
- `services/` depend on interfaces from `domain/`, never on `adapters/`
- `adapters/` implement interfaces from `domain/`
- External I/O uses `*.system.ts` suffix and is excluded from coverage

**Dependency injection:**

```typescript
// services/render.ts
export function renderDiagrams(
  config: ThemeConfig,
  deps?: { renderer: IRenderer; fs: IFileSystem }
) {
  const renderer = deps?.renderer ?? defaultRenderer;
  const fs = deps?.fs ?? defaultFs;
  // ...
}
```

### Coverage Targets

| Code Type | Target |
|-----------|--------|
| Domain (types, validation) | 100% |
| Services (extract, render, inject, check) | 80%+ |
| Adapters / system files (`*.system.ts`) | Excluded |
| CLI argument parsing | Excluded |

### Test Organization

| Location | Purpose | Dependencies |
|----------|---------|--------------|
| `tests/unit/` | Business logic | Mocks only |
| `tests/unit/services/` | Service orchestration | Mock renderer, mock FS |
| `tests/unit/domain/` | Type validation, diagram detection | None |
| `tests/mocks/` | Shared mock implementations | None |

## Documentation and Examples

The package includes a `docs/` directory with a tutorial and per-diagram-type guides shipped as part of the npm package and the GitHub repository README.

### Tutorial Structure

The tutorial progresses from basic to advanced, introducing one diagram type per section. Each section follows the same format:

1. **Why** — What problem this diagram type solves
2. **When to use** — Concrete scenarios where this type is the right choice
3. **Example** — Complete `.mmd` source with rendered output
4. **Fine-tuning** — Theme variables, layout direction, and styling notes specific to this type
5. **Common mistakes** — Pitfalls and how to avoid them

### Diagram Type Guide (ordered from basic to advanced)

#### 1. Sequence Diagram

**Why:** Models interactions between actors/services over time. Shows message passing, activation bars, and control flow (loops, alternatives, optional blocks).

**When to use:**
- User flows (login, checkout, onboarding)
- API call chains and service-to-service communication
- Data flow through a pipeline with conditional branches
- Debugging workflows with error handling paths

**Fine-tuning notes:**
- Use `participant` for explicit ordering, `actor` for stick-figure notation (human actors)
- Use `activate`/`deactivate` or `+`/`-` shorthand for activation bars
- `alt`/`else` for conditional branches, `loop` for iterations, `opt` for optional blocks
- `par` for parallel execution paths
- Keep participant names short (2-3 words) — they repeat horizontally across the diagram
- Use `Note right of` / `Note over` for annotations — avoid overusing
- `autonumber` adds sequential message numbering — useful for referencing steps in text

#### 2. Flowchart

**Why:** General-purpose diagram for any process, decision tree, or connected graph. The most versatile Mermaid diagram type.

**When to use:**
- Decision trees and branching logic
- Process documentation (CI/CD pipelines, deployment steps)
- State transitions that don't fit a formal state diagram
- Any "boxes and arrows" diagram

**Fine-tuning notes:**
- Use `TD` (top-down) for hierarchical processes, `LR` (left-right) for sequential flows
- Use subgraphs to group related steps — adds visual structure without extra syntax overhead
- Node shapes convey meaning: `[rectangle]` for process, `{diamond}` for decision, `([stadium])` for start/end, `[(cylinder)]` for database
- Edge labels should be short (1-3 words): `-->|yes|`, `-->|on failure|`
- Avoid more than 15-20 nodes per diagram — split into linked diagrams

#### 3. Class Diagram

**Why:** Documents object relationships, interfaces, and type hierarchies. Maps directly to TypeScript/Java/C# code.

**When to use:**
- Domain model documentation
- Interface hierarchies (dependency injection boundaries)
- API request/response type documentation
- Database entity relationships (when ER diagram is too formal)

**Fine-tuning notes:**
- Use `<<interface>>` annotations for dependency injection boundaries
- Show only public members unless internal structure is the point
- Use composition (`*--`) vs aggregation (`o--`) deliberately — composition means lifecycle ownership
- Keep inheritance depth to 2-3 levels in a single diagram
- Direction: `LR` works well for wide hierarchies, `TD` for deep ones

#### 4. C4 Diagrams (Level 1 → Level 3, then Class)

C4 diagrams are used in a progressive zoom pattern:

**Level 1 — C4Context (System Context)**

**Why:** Shows how your system fits into the world. Who uses it, what it talks to.

**When to use:**
- Project overview in README or ARCHITECTURE.md
- Stakeholder communication (non-technical audience)
- Identifying external dependencies

**Fine-tuning notes:**
- Keep to 5-10 elements — this is the 30,000ft view
- Use `System_Boundary` to group your own systems
- External systems use `System_Ext` — visually distinct from owned systems
- `Person` nodes for human actors only, not service accounts

**Level 2 — C4Container**

**Why:** Zooms into one system and shows its containers (services, databases, queues).

**When to use:**
- Docker Compose / Kubernetes service documentation
- Showing how containers communicate (HTTP, gRPC, queues)
- Infrastructure planning

**Fine-tuning notes:**
- One container per deployed unit (not per class)
- Show protocols on relationships: `Rel(api, db, "SQL/TCP")`
- Use `Container_Boundary` for logical groupings within the system
- Align with actual deployment topology

**Level 3 — C4Component**

**Why:** Zooms into one container and shows its internal components (modules, services, controllers).

**When to use:**
- Module-level architecture documentation
- Explaining Clean Architecture layers within a service
- Onboarding new developers to a specific service

**Fine-tuning notes:**
- Map components to actual source directories or modules
- Show only the interfaces between components, not internal implementation
- Use `Component` for each distinct responsibility
- Link back to Level 2 container for context

**C4 → Class transition:**
- Use C4 Level 3 to show component boundaries, then Class diagrams to detail the interfaces within each component
- Do not mix C4 and Class syntax in one diagram

#### 5. Requirement Diagram

**Why:** Visualizes requirements traceability — which components satisfy which requirements, and how requirements relate to each other. Follows SysML v1.6 notation.

**When to use:**
- Regulated projects requiring formal traceability (GxP, ISO, SOC2)
- PRD-to-implementation mapping
- Test coverage planning (which tests verify which requirements)
- Acceptance criteria visualization

**Fine-tuning notes:**
- Use `risk: High/Medium/Low` to highlight critical requirements
- `verifymethod` should match your actual test strategy: `Test` for automated, `Inspection` for code review, `Demonstration` for manual QA
- Relationship types: `satisfies` (code → requirement), `verifies` (test → requirement), `derives` (requirement → sub-requirement), `traces` (general link)
- Keep to 10-15 requirements per diagram — split by feature area

#### 6. Gitgraph

**Why:** Visualizes Git branching strategy with commits, branches, merges, and cherry-picks.

**When to use:**
- Documenting branching strategy (GitFlow, trunk-based, etc.)
- Explaining a merge/release process
- Illustrating a complex rebase or cherry-pick scenario
- Onboarding developers to the team's Git workflow

**Fine-tuning notes:**
- Use `commit id: "message"` for meaningful commit labels
- `commit tag: "v1.0"` to mark releases
- Branch names should match your actual convention (`feat/`, `fix/`, `release/`)
- Keep to 10-15 commits — this visualizes strategy, not history
- Use `cherry-pick id: "abc"` sparingly — it adds visual complexity

#### 7. Mindmap

**Why:** Hierarchical brainstorming and concept organization. Shows relationships between ideas radiating from a central topic.

**When to use:**
- Feature brainstorming and ideation
- Knowledge domain mapping
- Meeting notes and decision trees
- Project scope visualization

**Fine-tuning notes:**
- Indent levels define hierarchy — no explicit edge syntax
- Node shapes: `(rounded)`, `[square]`, `((circle))`, `)cloud(`, `{{hexagon}}`
- Keep depth to 3-4 levels — deeper nesting becomes unreadable
- Use as a planning tool, then convert insights into formal diagrams (flowchart, C4)

#### 8. Timeline

**Why:** Chronological visualization of events, milestones, or periods.

**When to use:**
- Project roadmaps and milestone planning
- Historical documentation (incident timelines, feature history)
- Release planning and sprint timelines
- Onboarding: "how we got here"

**Fine-tuning notes:**
- Group related events with `section` blocks
- Multiple events per time period use colon separators: `2024 Q1 : Event A : Event B`
- Timeline is experimental in Mermaid — icon integration may change
- Keep to 10-15 time periods per diagram
- Time periods are text labels, not parsed dates — use consistent formatting

#### 9. Quadrant Chart

**Why:** Two-dimensional analysis plotting items against two axes. The classic strategic analysis tool.

**When to use:**
- Boston matrix (growth vs share) for product portfolio analysis
- Effort vs impact prioritization in PRDs
- Risk vs likelihood assessment
- Technology evaluation (maturity vs fit)
- MoSCoW prioritization visualization

**Fine-tuning notes:**
- Axis labels use `-->` for direction: `x-axis Low Cost --> High Cost`
- Data points use `[x, y]` where both values range 0 to 1
- Label each quadrant with `quadrant-1` through `quadrant-4` (numbered counter-clockwise from top-right)
- Use point classes for color-coding categories
- Keep to 10-20 data points — more becomes cluttered

#### 10. Kanban

**Why:** Visualizes work items moving through workflow stages. Familiar to anyone using Jira, Trello, or Azure DevOps.

**When to use:**
- Process documentation (how work flows through stages)
- Current sprint or iteration status
- Workflow design and bottleneck identification
- Task handoff documentation between teams

**Fine-tuning notes:**
- Kanban is experimental in Mermaid — syntax may change
- Use `@{ assigned: "name", priority: "High" }` metadata for task context
- `ticketBaseUrl` config links ticket IDs to external systems (Jira, GitHub Issues)
- Priority values: `Very High`, `High`, `Low`, `Very Low`
- Columns represent stages, not people — name them as workflow states

#### 11. Architecture (Cloud Diagrams)

**Why:** Visualizes cloud infrastructure and service relationships using iconographic notation. Purpose-built for AWS, Azure, GCP architecture diagrams.

**When to use:**
- Cloud infrastructure documentation
- CI/CD pipeline architecture
- Network topology and service mesh diagrams
- Deployment architecture for DevOps documentation

**Fine-tuning notes:**
- Architecture diagrams are experimental (Mermaid 11.1.0+) — verify renderer support
- Default icons: `cloud`, `database`, `disk`, `internet`, `server`
- Register iconify icon packs for cloud provider logos (AWS, Azure, GCP — 200,000+ icons available)
- Use `junction` nodes for 4-way connection points (network hubs, load balancers)
- Edge direction syntax: `service1:R -- L:service2` (R=right, L=left, T=top, B=bottom)
- Nest services in groups with `in` keyword for VPCs, subnets, resource groups
- Pair with C4 Container diagrams — Architecture for physical topology, C4 for logical

### Example Files

The package ships example `.mmd` files in `examples/` covering each diagram type:

```
examples/
  01-sequence-user-login.mmd
  02-flowchart-ci-pipeline.mmd
  03-class-domain-model.mmd
  04-c4-context.mmd
  05-c4-container.mmd
  06-c4-component.mmd
  07-requirement-traceability.mmd
  08-gitgraph-branching.mmd
  09-mindmap-feature-brainstorm.mmd
  10-timeline-project-roadmap.mmd
  11-quadrant-effort-impact.mmd
  12-kanban-sprint-board.mmd
  13-architecture-cloud-deploy.mmd
```

Each example includes comments explaining the syntax choices and is renderable with `mmd render`.

### Acceptance Criteria (Documentation)

21. Tutorial covers all 11 diagram types in the specified order
22. Each diagram type section includes: why, when to use, example, fine-tuning, common mistakes
23. Example `.mmd` files render without errors using `mmd render`
24. Tutorial is accessible from the package README and as standalone docs

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| beautiful-mermaid lacks C4 diagram support | C4 diagrams (used in ARCHITECTURE.md) won't render | Fallback renderer (mmdc) handles unsupported types automatically |
| beautiful-mermaid is a newer project with limited adoption | Potential bugs, breaking changes | Pin version, wrap behind `IRenderer` interface for easy swap |
| mmdc requires Puppeteer (heavy dependency) | Slow installs, CI overhead | Only installed as optional peer dep when fallback is needed |
| GitHub changes `<picture>` tag rendering | Injected markup stops working | `<picture>` with `srcset` is documented GitHub behavior; fallback to `<img>` is trivial |
| Regex-based Mermaid block extraction misses edge cases | Blocks with unusual formatting skipped | Use well-tested pattern; `mmd check` catches orphaned blocks |
| Version drift between npm and GitHub Packages | Consumers get different versions depending on registry | CD pipeline fails release if either publish step fails |
| Kanban, Architecture, Timeline are experimental in Mermaid | Syntax may change across versions | Document minimum Mermaid version per diagram type; pin renderer version |

## Feasibility Validation

The following tests were run using `@mermaid-js/mermaid-cli@11.12.0` (mmdc) with the GitHub light and dark theme configs defined in this PRD. Results confirm renderer support and theme application across all diagram types.

### Render Test Results (mmdc 11.12.0)

| Diagram Type | Renders | Light Theme | Dark Theme | Notes |
|-------------|---------|-------------|------------|-------|
| Sequence | Pass | Pass | Pass | Standard `sequenceDiagram` — full theme support. |
| Flowchart | Pass | Pass | Pass | Theme colors correctly embedded in SVG CSS. |
| Class | Pass | Pass | Pass | |
| C4 Context | Pass | Pass | Pass | |
| Kanban | Pass | Pass | Pass | Experimental but functional. |
| Architecture | Pass (warnings) | Pass | Pass | Warnings about unmapped label properties on edges — cosmetic, non-blocking. |
| Timeline | Pass | Pass | Pass | Experimental but functional. |
| Quadrant | Pass | Pass | Pass | |
| Requirement | Pass* | Pass | Pass | *Requires no indentation inside `requirement {}` blocks — whitespace-sensitive parser. |
| Gitgraph | Pass | Pass | Pass | |
| Mindmap | Pass | Pass | Pass |

ZenUML was evaluated but dropped — dark theme SVGs silently fail to write (exit 0, no file). Standard `sequenceDiagram` provides equivalent functionality with full theme support. |

### Theme Validation

Confirmed by inspecting SVG CSS output:

- **Light SVG**: `fill:#1f2328` (GitHub light text), `fill:#ddf4ff` (primary), `stroke:#218bff` (border), `stroke:#656d76` (line color)
- **Dark SVG**: `fill:#e6edf3` (GitHub dark text), `fill:#1f3a5f` (primary), `stroke:#58a6ff` (border), `stroke:#8b949e` (line color)

Theme variables are correctly applied to all standard diagram types via mmdc `-c` config flag.

### Validated Risks

| Risk | Status | Finding |
|------|--------|---------|
| ZenUML theming | **Dropped** | Dark theme SVGs silently fail. Replaced with standard `sequenceDiagram` which has full theme support. |
| Requirement diagram syntax | **New finding** | Parser requires zero indentation inside `requirement {}` blocks. Indented syntax causes parse errors. |
| Architecture warnings | **Minor** | Edge label mapping warnings are cosmetic and do not affect output. |
| C4 support (mmdc) | **Cleared** | C4Context renders without issues. |
| Kanban stability | **Cleared** | Renders and themes correctly in mmdc 11.12.0. |
| Timeline stability | **Cleared** | Renders and themes correctly. |

### Impact on Design

1. **Requirement diagram whitespace**: The AI skill files and tutorial must document the no-indentation requirement. The `mmd check` lint command should validate `.mmd` syntax before rendering.

## Dependencies

- [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) — primary SVG renderer
- [@mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli) — fallback renderer (optional peer dep)
- Bun runtime

## IDE Integration

### VS Code: Mermaid Chart Extension

The AI skill files and tutorial should recommend installing the [Mermaid Chart VS Code extension](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart) for local diagram editing and preview.

**Extension ID:** `MermaidChart.vscode-mermaid-chart`

**Install:**
```bash
code --install-extension MermaidChart.vscode-mermaid-chart
```

**Capabilities:**
- Live preview of `.mmd` files in VS Code
- Syntax highlighting and autocompletion for Mermaid syntax
- Side-by-side editing and rendered output
- Supports all Mermaid diagram types including experimental ones

**Integration with @lekman/mmd:**
- Edit `.mmd` files in VS Code with live preview
- Run `mmd render` to generate themed SVGs when satisfied with the diagram
- The extension previews using Mermaid's default theme; the final rendered SVGs use the `.mermaid.json` config — expect visual differences between preview and output

**Recommended VS Code settings (`.vscode/extensions.json`):**
```json
{
  "recommendations": [
    "MermaidChart.vscode-mermaid-chart"
  ]
}
```

The `mmd init` command should create or append to `.vscode/extensions.json` with this recommendation.

### Acceptance Criteria (IDE)

25. `mmd init` adds VS Code extension recommendation to `.vscode/extensions.json`
26. Tutorial includes VS Code extension installation and usage instructions
27. AI skill files mention the extension as the recommended editor for `.mmd` files

## Future Considerations

- Watch mode (`mmd watch`) for local development
- GitHub Action for CI rendering (run `mmd sync` on push, commit SVGs)
- beautiful-mermaid gaining C4 support, removing the mmdc fallback
- Config inheritance (global `~/.mermaid.json` + per-repo override)
- Mermaid block extraction from other formats (`.mdx`, `.adoc`)

## References

- [GitHub: Images with theme context](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#specifying-the-theme-an-image-is-shown-to)
- [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid)
- [Mermaid CLI (mmdc)](https://github.com/mermaid-js/mermaid-cli)
