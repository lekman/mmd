# Changelog

## [1.3.2](https://github.com/lekman/mmd/compare/mmd-v1.3.1...mmd-v1.3.2) (2026-04-06)


### Bug Fixes

* **render:** strip Mermaid YAML frontmatter before rendering ([e973d6b](https://github.com/lekman/mmd/commit/e973d6bf6a29f75777e93d6b11061af983c03cb2))

## [1.3.1](https://github.com/lekman/mmd/compare/mmd-v1.3.0...mmd-v1.3.1) (2026-04-02)


### Bug Fixes

* **inject:** deduplicate image tags on repeated save ([07bc877](https://github.com/lekman/mmd/commit/07bc8774b277d34a789e34b445c3effc2e8e9515))

## [1.3.0](https://github.com/lekman/mmd/compare/mmd-v1.2.1...mmd-v1.3.0) (2026-04-02)


### Features

* add configurable renderWidth for mmdc viewport (default 1200) ([7cbb0fd](https://github.com/lekman/mmd/commit/7cbb0fd0e2315fc99a08799f05c459d264e56442))
* add convert command for per-file/per-block mermaid conversion ([455315e](https://github.com/lekman/mmd/commit/455315eb3374a79b4925d8419c012f5b5dbe6169))
* add SVG post-processing with background, border, and rounded corners ([1db1996](https://github.com/lekman/mmd/commit/1db1996fbab3bd5bbf7a36197d35a422b5ba69fb))
* add VSCode extension with CodeLens, on-save sync, and commands ([c4fae05](https://github.com/lekman/mmd/commit/c4fae0540844d16c511771def3848355708d0edd))
* **cli:** add config command and task run for local development ([cc41b13](https://github.com/lekman/mmd/commit/cc41b13766d65b2c3574c5e1528060a0b2980930))
* **cli:** add file path arguments and single-mode render output ([f0c668c](https://github.com/lekman/mmd/commit/f0c668cdbf0835bfd6a011dea51af39cd7874bda))
* **init:** add gitignore overrides for AI rule files and update README ([6309125](https://github.com/lekman/mmd/commit/63091253851db2274252c72fe0fe8c270a5d7596))
* switch to single-mode rendering with standard markdown images ([6ac4cc7](https://github.com/lekman/mmd/commit/6ac4cc764e309848c25a9a8b7590b0e459c7c83a))


### Bug Fixes

* address CodeRabbit review findings ([cded157](https://github.com/lekman/mmd/commit/cded1573fd805b4c141334d198a1534224b9f8dd))
* **cli:** default task run to sync command ([4028e82](https://github.com/lekman/mmd/commit/4028e82cd76625a1962b0859950eb2e1e166ace2))
* **extract:** avoid naming collisions with existing anchors ([536690e](https://github.com/lekman/mmd/commit/536690e964206cc8e828cd335a7b6b7036f36003))
* **extract:** skip mermaid blocks nested inside outer code fences ([873faad](https://github.com/lekman/mmd/commit/873faade19f27a76b5c73697e98f7fc2a3b07942))
* **inject:** compute relative paths from source file to output directory ([4f51c13](https://github.com/lekman/mmd/commit/4f51c13b95afab52fc8a5ae1eea172e4cdd7afca))
* **render:** correct beautiful-mermaid supported types and mmdc binary resolution ([8857fb8](https://github.com/lekman/mmd/commit/8857fb8dca63a8a9094c195068ff50a7fe292cd1))
* **render:** resolve mmdc binary path instead of using npx ([bdde279](https://github.com/lekman/mmd/commit/bdde279d680ce25747355c5a9858b1e0a2d5f0c0))
* **test:** use replaceAll for glob pattern in mock filesystem ([801247b](https://github.com/lekman/mmd/commit/801247bb34b33c0483fd9a27eb0535086d32a225))


### Documentation

* convert ARCHITECTURE.md diagrams to mermaid SVGs ([a55fd2c](https://github.com/lekman/mmd/commit/a55fd2cb9a1abf2a966ac0f2dcf9de33bc603949))
* move README to root, update CLAUDE.md and Taskfile ([fcbabdd](https://github.com/lekman/mmd/commit/fcbabddd07b5ea664ecfcfa86e08d4c5ab594466))
* restructure README with VSCode-first quick start and marketplace badge ([33e213a](https://github.com/lekman/mmd/commit/33e213a2121d2cb25d1ee622af08aae3f0f4356e))
* streamline README, CONTRIBUTING, and QA documentation ([4cd2cf2](https://github.com/lekman/mmd/commit/4cd2cf2b283e9479483611da73c35f43eb759d67))
* update AI templates with convert command and self-styled SVGs ([39c075b](https://github.com/lekman/mmd/commit/39c075b763889a5a4622de9fa2132b080c0b40da))
* update all references from &lt;picture&gt; tags to markdown images ([0b1fd9a](https://github.com/lekman/mmd/commit/0b1fd9a75835e53019c8cd3c75b253ab8004fa6c))
* update mermaid-cli installation to use npm globally ([3f6c61f](https://github.com/lekman/mmd/commit/3f6c61f2dcf4fd42f1defa77fcfed6721deb1843))

## [1.2.1](https://github.com/lekman/mmd/compare/mmd-v1.2.0...mmd-v1.2.1) (2026-01-31)


### Documentation

* consolidate MAINTAINERS.md into CONTRIBUTING.md and move under docs ([f1be0c3](https://github.com/lekman/mmd/commit/f1be0c33cd2961e9d60fc35243c1827c90f633fe))

## [1.2.0](https://github.com/lekman/mmd/compare/mmd-v1.1.0...mmd-v1.2.0) (2026-01-31)


### Features

* **ci:** add continuous deployment workflow for npm and GitHub Packages ([82ffe84](https://github.com/lekman/mmd/commit/82ffe841db97a8524e66c4e4b5de77f94471ed75))

## [1.1.0](https://github.com/lekman/mmd/compare/mmd-v1.0.0...mmd-v1.1.0) (2026-01-31)


### Features

* **docs:** add comprehensive documentation for @lekman/mmd ([b62e7ec](https://github.com/lekman/mmd/commit/b62e7ec52a518fd500bab3a8288f74083a0e7e46))

## 1.0.0 (2026-01-30)


### Documentation

* add PRD for @lekman/mmd CLI tool ([bd4e51e](https://github.com/lekman/mmd/commit/bd4e51e481c7c517a7ee223a59405279c9d95eb5))

## Changelog
