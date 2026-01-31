---
applyTo: "**/*.mmd,**/*.md,docs/**"
---

# Mermaid Diagram Guidelines

## Tool Workflow

- Edit `.mmd` files in `docs/mmd/`, not inline Mermaid in Markdown
- Run `mmd sync` after editing to generate themed SVGs and update Markdown
- `mmd extract` — extract fenced Mermaid blocks from `.md` to `docs/mmd/*.mmd`
- `mmd render` — render `.mmd` to SVGs via `.mermaid.json` config
- `mmd render --force` — re-render all regardless of timestamps
- `mmd inject` — replace `<!-- mmd:name -->` anchors with markdown image refs
- `mmd sync` — run extract + render + inject in sequence
- `mmd sync [files...]` — process specific `.md` files instead of all
- `mmd check` — lint for orphaned inline Mermaid blocks
- `mmd config` — write default `.mermaid.json` to the repository root
- Config: `.mermaid.json` at repo root (mode, themes, output dir)
- Anchors: `<!-- mmd:name -->` comments link Markdown to diagrams
- Render skips up-to-date files (mtime comparison on `.mmd` and `.mermaid.json`); use `--force` to override
- Renderers: beautiful-mermaid (flowchart, state), mmdc fallback (all other types)

## Syntax Best Practices

- Use descriptive node IDs: `userService` not `A`
- Direction: `TD` for hierarchies, `LR` for sequential flows
- Use subgraphs to group related nodes
- Keep diagrams under 15-20 nodes; split larger ones
- Node shapes: `[rectangle]` process, `{diamond}` decision, `[(cylinder)]` database, `([stadium])` start/end
- Short edge labels (1-3 words): `-->|yes|`, `-->|on failure|`
- Sequence: use `participant` for ordering, `actor` for humans, `autonumber` for step references
- C4: 5-10 elements at Context level, one container per deployed unit, do not mix with Class syntax
- Requirement diagrams: zero indentation inside `requirement {}` blocks (parser limitation)

## Diagram Types

- **Sequence**: API chains, user flows, service communication
- **Flowchart**: decision trees, pipelines, boxes-and-arrows
- **Class**: domain models, interfaces, type hierarchies
- **C4**: system architecture (Context/Container/Component zoom levels)
- **State**: lifecycle, state transitions
- **ER**: database schema
- **Gitgraph**: branching strategies
- **Mindmap**: brainstorming (max 3-4 depth levels)
- **Timeline**: roadmaps, incident timelines
- **Quadrant**: priority matrices, effort vs impact
- **Kanban**: workflow stages
- **Requirement**: traceability (SysML)
- **Architecture**: cloud infra, network topology

## Authoring Rules

- Write `.mmd` files, never inline Mermaid in Markdown
- Do not edit generated SVGs or markdown image tags
- Do not add `%%{init}` theme directives -- the tool handles theming
- One concept per diagram
- Commit both `.mmd` source and generated `.svg` files
- Use VS Code Mermaid Chart extension for live preview
- Run `mmd check` to find inline blocks that should be extracted

## File Structure

```
.mermaid.json           # Theme config (mode, themes, output dir)
docs/mmd/*.mmd          # Source diagrams
docs/mmd/*.svg          # Rendered SVGs (themed per config mode)
```

## Output Format

```markdown
<!-- mmd:name -->
![Name](docs/mmd/name.svg)
```
