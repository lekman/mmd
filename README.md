# Mermaid Diagram Management

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/lekman.mmd?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=lekman.mmd)
[![npm version](https://img.shields.io/npm/v/@lekman/mmd)](https://www.npmjs.com/package/@lekman/mmd)
[![codecov](https://codecov.io/gh/lekman/mmd/graph/badge.svg?token=Q9JrvN8z9A)](https://codecov.io/gh/lekman/mmd)

Extract, render, and inject themed SVGs into Markdown. Diagrams render correctly on GitHub, VS Code, Confluence, and Word exports — no `<div>` wrappers needed.

<a href="docs/mmd/architecture-1.svg"><img src="docs/mmd/architecture-1.svg" alt="Rendered SVG preview" width="400"></a>

## Installation

### VS Code Extension (recommended)

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=lekman.mmd). Provides CodeLens actions, on-save sync, and command palette integration.

### CLI (terminal, CI pipelines, AI agents)

Requires [Bun](https://bun.sh/) runtime.

```bash
bunx @lekman/mmd sync            # run directly
bun add -g @lekman/mmd           # or install globally
```

### AI Coding Assistant Rules

Installs rules for Claude Code, Cursor, and GitHub Copilot. Committed to the repo so all contributors benefit.

```bash
bunx @lekman/mmd init            # auto-detect and install
bunx @lekman/mmd init --all      # install all rule files
```

## Quick Start

### VS Code

1. Add a mermaid fenced block to any `.md` file
2. Click **"Convert to SVG"** on the CodeLens above the block
3. The block is extracted, rendered to a self-styled SVG, and replaced with an image tag
4. Edit the `.mmd` source file — SVGs re-render on save automatically

<a href="docs/assets/ide.png"><img src="docs/assets/ide.png" alt="CodeLens actions in VS Code" width="400"></a>

### CLI / AI Agents

```bash
bunx @lekman/mmd convert README.md     # convert blocks in a file
bunx @lekman/mmd sync                  # sync all .md files
bunx @lekman/mmd render --force        # re-render after editing .mmd
```

## Commands

| Command | Description |
| ------- | ----------- |
| `mmd convert <file>` | Convert mermaid blocks to SVG references |
| `mmd sync [files...]` | Extract + render + inject (use `--force` to re-render all) |
| `mmd render [files...]` | Render stale `.mmd` to `.svg` |
| `mmd extract [files...]` | Extract fenced blocks to `.mmd` files |
| `mmd inject [files...]` | Update anchor comments with image tags |
| `mmd check [files...]` | Lint for orphaned inline mermaid blocks |
| `mmd config` | Write default `.mermaid.json` |
| `mmd init` | Install AI assistant rules (`--all`, `--claude`, `--cursor`, `--copilot`) |

## Configuration

Place a `.mermaid.json` in your repository root:

```json
{
  "outputDir": "docs/mmd",
  "mode": "light",
  "renderWidth": 1200,
  "svgStyle": {
    "background": "#ffffff",
    "borderColor": "#cccccc",
    "borderRadius": 10,
    "padding": 20
  }
}
```

Run `mmd config` to generate a full config with light and dark themes matching GitHub's color palettes.

| Field | Description |
| ----- | ----------- |
| `outputDir` | Directory for `.mmd` and `.svg` files |
| `mode` | `"light"` or `"dark"` theme selection |
| `renderWidth` | Puppeteer viewport width for mmdc (default: 1200) |
| `svgStyle` | Background, border, corner radius, padding baked into SVGs |
| `themes` | Light and dark Mermaid theme variables |
| `renderer` | Primary renderer (`beautiful-mermaid`) |
| `fallbackRenderer` | Fallback for unsupported types (`mmdc`) |

## Renderer Support

| Renderer | Diagram Types |
| -------- | ------------- |
| beautiful-mermaid | flowchart, state |
| mmdc (fallback) | sequence, class, ER, C4, gantt, pie, gitgraph, mindmap, timeline, quadrant, kanban, requirement, architecture |

Install mmdc for non-flowchart/state diagrams: `npm install -g @mermaid-js/mermaid-cli`

## Documentation

| Document | Audience |
| -------- | -------- |
| [Architecture](docs/ARCHITECTURE.md) | C4 diagrams, Clean Architecture layers, data flow |
| [Contributing](docs/CONTRIBUTING.md) | Dev setup, task commands, CI/CD, release process |
| [Quality Assurance](docs/QA.md) | TDD workflow, coverage targets, test strategy |
| [Security](docs/SECURITY.md) | Vulnerability reporting, threat model |
| [Changelog](docs/CHANGELOG.md) | Release history |
| [Examples](examples/) | `.mmd` files for all 15 supported diagram types |

## License

[MIT](LICENSE)
