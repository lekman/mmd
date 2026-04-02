# Mermaid Diagram Manager

Convert and sync Mermaid diagrams to self-styled SVGs in Markdown.

## Features

- **Convert** mermaid fenced blocks to rendered SVGs with a single click
- **Auto-sync** on save — edit `.mmd` files and SVGs re-render automatically
- **CodeLens** actions above mermaid blocks and anchor comments
- **Self-styled SVGs** with white background, rounded corners, and border — no `<div>` wrappers needed

## Usage

1. Open a Markdown file containing mermaid fenced blocks
2. Click **"Convert to SVG"** above any `` ```mermaid `` block
3. The block is extracted to a `.mmd` file, rendered to SVG, and replaced with an anchor + image tag

After conversion, CodeLens actions appear above each `<!-- mmd:name -->` anchor:

- **Edit Source** — opens the `.mmd` file
- **Re-render** — regenerates the SVG

## On-Save Automation

Enabled by default (`mmd.syncOnSave`):

- Save a `.mmd` file — SVG is re-rendered
- Save a `.md` file — image tags are updated
- Save `.mermaid.json` — all diagrams re-render with the new theme

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `mmd.syncOnSave` | `true` | Auto-sync on file save |
| `mmd.outputDir` | `docs/mmd` | Where `.mmd` and `.svg` files are stored |

## Companion Tools

- **CLI**: `bunx @lekman/mmd sync` for terminal and CI pipelines
- **Mermaid Chart extension**: Use alongside for live preview and editing
- **AI rules**: `bunx @lekman/mmd init` installs rules for Claude Code, Cursor, and Copilot

## Configuration

Place a `.mermaid.json` in your repository root to configure themes and output:

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
