# Mermaid Diagram Management

[![npm version](https://img.shields.io/npm/v/@lekman/mmd)](https://www.npmjs.com/package/@lekman/mmd)

Extract, render, and inject themed SVGs into Markdown.

## Overview

`@lekman/mmd` eliminates manual Mermaid theming hacks across repositories. It extracts inline Mermaid diagram blocks from Markdown files, renders them to themed SVGs using a configurable light/dark mode, and injects standard markdown image tags back into the Markdown. The result is diagrams that render correctly on GitHub and in VS Code.

## Features

- Extract inline Mermaid blocks from `.md` files into standalone `.mmd` files
- Render `.mmd` files to `*.svg` using configurable light or dark theme
- Inject standard markdown image tags (`![alt](path)`) into Markdown
- Timestamp-based staleness checking — re-renders when `.mmd` or `.mermaid.json` changes
- Dual renderer: [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) for supported types, [mermaid-cli](https://github.com/mermaid-js/mermaid-cli) fallback for the rest
- AI coding assistant rule files for Claude Code, Cursor, and GitHub Copilot
- Supports 15 Mermaid diagram types: flowchart, sequence, class, state, ER, C4, gantt, pie, gitgraph, mindmap, timeline, quadrant, kanban, requirement, architecture

## Installation

Requires [Bun](https://bun.sh/) runtime.

```bash
# Install base mermaid-cli renderer
bun install -g @mermaid-js/mermaid-cli

# Run directly (no install needed)
bunx @lekman/mmd sync

# Or install globally
bun add -g @lekman/mmd
```

## Quick Start

1. Add a Mermaid block to any `.md` file:

    ````markdown
    ```mermaid
    flowchart TD
      A[Write Markdown] --> B[Add Mermaid block]
      B --> C[Run mmd sync]
      C --> D[Commit SVGs]
    ```
    ````

2. Run the sync command:

    ```bash
    bunx @lekman/mmd sync
    ```

3. The tool extracts the block to `docs/mmd/<name>.mmd`, renders a themed SVG, and replaces the fenced block with a markdown image:

    ```markdown
    <!-- mmd:architecture-0 -->
    ![Architecture 0](docs/mmd/architecture-0.svg)
    ```

4. Commit both the `.mmd` source files and the generated `.svg` files.

## Commands

| Command | Description | Flags |
| ------- | ----------- | ----- |
| `mmd extract [files...]` | Scan `.md` files, extract Mermaid blocks to `docs/mmd/*.mmd` | |
| `mmd render [files...]` | Render stale `docs/mmd/*.mmd` to `*.svg` | `--force` re-render all |
| `mmd inject [files...]` | Replace anchor comments in `.md` files with markdown image refs | |
| `mmd sync [files...]` | Run extract + render + inject in sequence | `--force` re-render all |
| `mmd check [files...]` | Lint: warn on inline Mermaid blocks in managed `.md` files | |
| `mmd config` | Write default `.mermaid.json` to the repository root | `--force` overwrite existing |
| `mmd init` | Install AI coding assistant rule files | `--global`, `--all`, `--claude`, `--cursor`, `--copilot`, `--force` |

## Configuration

Create a `.mermaid.json` file in your repository root. This defines the output directory and shared theme variables for all diagrams:

```json
{
  "outputDir": "docs/mmd",
  "mode": "light",
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

The default themes match GitHub's light and dark color palettes.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `outputDir` | `string` | Directory for `.mmd` source files and generated SVGs |
| `mode` | `"light"` \| `"dark"` | Which theme to use for rendering (default: `"light"`) |
| `themes.light` | `ThemeDef` | Mermaid theme config for light mode |
| `themes.dark` | `ThemeDef` | Mermaid theme config for dark mode |
| `renderer` | `string` | Primary renderer (`beautiful-mermaid`) |
| `fallbackRenderer` | `string` | Fallback for unsupported diagram types (`mmdc`) |

## Workflow

The tool supports two editing workflows:

### Adding a new diagram to Markdown

```
Edit .md file → add ```mermaid block → mmd sync
  1. Extract: fenced block → docs/mmd/<name>.mmd
  2. Render:  .mmd → .svg (using selected theme mode)
  3. Inject:  replace fenced block with <!-- mmd:name --> + ![alt](path)
```

### Editing an existing `.mmd` file directly

```
Edit docs/mmd/<name>.mmd → mmd render (or mmd sync)
  Compare max(.mmd mtime, .mermaid.json mtime) vs .svg mtime
  If source is newer → re-render SVG with selected theme
  If .svg is newer → skip (already up to date)
```

Use `--force` to re-render all diagrams regardless of timestamps.

## Renderer Support

The primary renderer is beautiful-mermaid (zero-DOM, TypeScript-native). Diagram types it does not support fall back to mermaid-cli (mmdc, Puppeteer-based).

| Renderer | Diagram Types |
| -------- | ------------- |
| beautiful-mermaid | flowchart, state |
| mmdc (fallback) | sequence, class, ER, C4, gantt, pie, gitgraph, mindmap, timeline, quadrant, kanban, requirement, architecture |

Diagram type is detected by parsing the first non-comment line of the `.mmd` file.

## AI Coding Assistant Integration

`mmd init` installs rule files that teach AI coding assistants the Mermaid workflow and `.mmd` file conventions:

| AI Tool | Installed Path | Trigger |
| ------- | -------------- | ------- |
| Claude Code | `.claude/skills/mermaid/SKILL.md` | Auto-invoked on `.mmd` files |
| Cursor | `.cursor/rules/mermaid.mdc` | Activated on `.mmd` and `.md` edits |
| GitHub Copilot | `.github/instructions/mermaid.instructions.md` | Applied to `**/*.mmd` and `docs/**` |

```bash
mmd init              # Auto-detect installed tools, install matching rules
mmd init --all        # Install all rule files
mmd init --global     # Install to user-level paths (Claude Code only)
mmd init --force      # Overwrite existing rule files
```

## Generated File Structure

```
repo/
  .mermaid.json                    # Theme configuration
  docs/
    ARCHITECTURE.md                # Contains <!-- mmd:xxx --> anchors + image refs
    mmd/
      system-context.mmd           # Source diagram
      system-context.svg           # Rendered SVG (themed per config mode)
```

## Examples

The [`examples/`](examples/) directory contains `.mmd` files for all supported diagram types:

| File | Diagram Type |
| ---- | ------------ |
| `01-sequence-user-login.mmd` | Sequence |
| `02-flowchart-ci-pipeline.mmd` | Flowchart |
| `03-class-domain-model.mmd` | Class |
| `04-c4-context.mmd` | C4 Context |
| `05-c4-container.mmd` | C4 Container |
| `06-c4-component.mmd` | C4 Component |
| `07-requirement-traceability.mmd` | Requirement |
| `08-gitgraph-branching.mmd` | Gitgraph |
| `09-mindmap-feature-brainstorm.mmd` | Mindmap |
| `10-timeline-project-roadmap.mmd` | Timeline |
| `11-quadrant-effort-impact.mmd` | Quadrant |
| `12-kanban-sprint-board.mmd` | Kanban |
| `13-architecture-cloud-deploy.mmd` | Architecture |

## Documentation

| Document | Audience | Content |
| -------- | -------- | ------- |
| [Architecture](ARCHITECTURE.md) | Contributors | C4 diagrams, Clean Architecture layers, data flow |
| [Contributing](CONTRIBUTING.md) | Contributors | Dev setup, task commands, CI/CD, release process, PR conventions |
| [Quality Assurance](QA.md) | Contributors | Test strategy, TDD workflow, coverage targets |
| [Security](SECURITY.md) | Security researchers | Vulnerability reporting, threat model |
| [Changelog](CHANGELOG.md) | Users | Release history |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR process, and commit conventions.

## License

[MIT](LICENSE)
