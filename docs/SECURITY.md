# Security

Security policy for @lekman/mmd. This tool processes local files only (Markdown and Mermaid diagrams). It does not handle secrets, credentials, or network connections during normal operation.

## Reporting a Vulnerability

### Do Not Create a Public Issue

Security vulnerabilities should never be reported through public GitHub issues.

### Report Privately

Use [GitHub Security Advisories](https://github.com/lekman/mmd/security/advisories) to create a private advisory.

Include:

- Type of vulnerability
- Affected source file(s) and location
- Steps to reproduce
- Impact assessment

### Response Timeline

| Severity | Response | Resolution Target |
| -------- | -------- | ----------------- |
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium | 5 business days | 30 days |
| Low | 10 business days | 60 days |

## Security Design Practices

1. **Local-only operation** — no network access during extract, render, inject, or sync
2. **Scoped file access** — file operations are restricted to the repository and configured `outputDir`
3. **No secrets handled** — the tool processes diagram content only, no credentials or tokens
4. **Static templates** — `mmd init` copies bundled template files, no dynamic code generation
5. **Shift-left scanning** — Semgrep runs in CI on every PR (`p/security-audit`, `p/secrets`, `p/typescript`)
6. **No `console.log` in production** — enforced by Semgrep custom rule to prevent accidental data leaks

## CIA Triad

### Confidentiality

**Goal:** The tool does not expose file content beyond the local filesystem.

| Control | Implementation |
| ------- | -------------- |
| No network calls | Rendering is local (beautiful-mermaid is in-process, mmdc is a local subprocess) |
| No telemetry | The tool sends no data to external services |
| Scoped file reads | Only reads `.md`, `.mmd`, and `.mermaid.json` files |
| Scoped file writes | Writes only to `outputDir` (SVGs) and anchor-managed `.md` files |

### Integrity

**Goal:** Generated SVGs and modified Markdown files are deterministic and untampered.

| Control | Implementation |
| ------- | -------------- |
| Deterministic output | Same `.mmd` input and `.mermaid.json` config produces identical SVGs |
| Anchor convention | `<!-- mmd:name -->` comments mark tool-managed regions in Markdown |
| No manual SVG edits | SVGs are generated artifacts — the source of truth is the `.mmd` file |
| Pre-commit hooks | Lint and typecheck run before every commit |
| CI quality gate | All checks must pass before merge to `main` |

### Availability

**Goal:** The tool runs without external dependencies at build time.

| Control | Implementation |
| ------- | -------------- |
| Zero-config primary renderer | beautiful-mermaid requires no browser or subprocess |
| Optional fallback | mmdc is only needed for diagram types beautiful-mermaid does not support |
| Bundled templates | AI skill templates are shipped in the npm package, not fetched at runtime |
| Offline operation | No network required for any command |

## STRIDE Threat Model

| Threat | Applies? | Mitigation |
| ------ | -------- | ---------- |
| **Spoofing** | No | No authentication — local CLI tool |
| **Tampering** | Low | SVGs are generated from `.mmd` source; tampering SVGs is overwritten on next render. npm package integrity verified by registry checksums. |
| **Repudiation** | No | No user actions to audit — this is a build tool |
| **Information Disclosure** | Low | No network calls. File reads are scoped to the repository. |
| **Denial of Service** | Low | Local tool. A malformed `.mmd` file could cause a renderer hang — mitigated by subprocess timeout in mmdc adapter. |
| **Elevation of Privilege** | Low | No elevated permissions required. `mmd init --global` writes only to `~/.claude/skills/`. |

## Dependency Security

| Tool | Purpose | Configuration |
| ---- | ------- | ------------- |
| Semgrep | Static analysis in CI | `p/security-audit`, `p/secrets`, `p/typescript` rulesets |
| Dependabot | Automated dependency updates | Weekly npm and GitHub Actions updates |
| CodeRabbit | Automated PR review | Biome, Semgrep, Gitleaks, Markdownlint checks |
| npm audit | Vulnerability scanning | Run manually with `npm audit` |

Custom Semgrep rules (`.semgrep.yml`):

- `no-secrets-in-code` — detect passwords and API keys
- `no-hardcoded-credentials` — detect hardcoded credentials
- `no-console-log-in-production` — warn on `console.log` (exclude tests)

## File System Access

The tool reads and writes files in two scopes:

### Repository scope (default)

| Operation | Files | Direction |
| --------- | ----- | --------- |
| Extract | `**/*.md` | Read + write (replace blocks with anchors) |
| Extract | `<outputDir>/*.mmd` | Write |
| Render | `<outputDir>/*.mmd` | Read |
| Render | `<outputDir>/*.light.svg`, `*.dark.svg` | Write |
| Inject | `**/*.md` | Read + write (inject `<picture>` tags) |
| Check | `**/*.md` | Read |
| Init | AI tool config directories | Write |

### Global scope (`--global`)

| Operation | Files | Direction |
| --------- | ----- | --------- |
| Init | `~/.claude/skills/mermaid/SKILL.md` | Write |

Path traversal is prevented by restricting output to the configured `outputDir` and using relative paths for `srcset` values in `<picture>` tags.

## Secrets Management

This tool handles no secrets. No API keys, tokens, or credentials are required for any operation. The renderers (beautiful-mermaid and mmdc) operate locally without authentication.

CI/CD secrets (`NPM_TOKEN`, `CODECOV_TOKEN`, `RELEASE_BOT_APP_ID`, `RELEASE_BOT_PRIVATE_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`) are managed through GitHub repository secrets and never appear in code. Semgrep enforces this in CI.
