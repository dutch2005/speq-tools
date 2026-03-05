<p align="center">
  <img src="assets/banner.svg" alt="enthropic"/>
</p>

<p align="center">
  <a href="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/ci.yml"><img src="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
  <a href="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/lint.yml"><img src="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/lint.yml/badge.svg" alt="Lint"/></a>
  <a href="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/codeql.yml"><img src="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"/></a>
  <a href="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/security-scan.yml"><img src="https://github.com/enthropic-spec/enthropic-tools/actions/workflows/security-scan.yml/badge.svg" alt="Security Scan"/></a>
  <a href="https://securityscorecards.dev/viewer/?uri=github.com/Enthropic-spec/enthropic-tools"><img src="https://api.securityscorecards.dev/projects/github.com/Enthropic-spec/enthropic-tools/badge" alt="OpenSSF Scorecard"/></a>
  <a href="https://slsa.dev"><img src="https://slsa.dev/images/gh-badge-level3.svg" alt="SLSA 3"/></a>
</p>

<p align="center">
  CLI companion for the <a href="https://github.com/enthropic-spec/enthropic">Enthropic</a> spec format.
</p>

---

A `.enth` file is the architectural contract of your project. Entities, constraints, layer boundaries, naming conventions. Write it once. Every AI session reads it before touching a single line of code.

The CLI validates your spec, tracks build progress, and produces the context block you paste into any AI assistant. Have an existing codebase? `enthropic reverse` reads it and generates a starter spec.

## Install

<p align="center">
  <a href="https://www.npmjs.com/package/enthropic">
    <img src="https://img.shields.io/badge/npm_install_--g_enthropic-ffafff?style=for-the-badge&labelColor=cc55cc&color=ffafff" alt="npm install -g enthropic"/>
  </a>
</p>

Requires Node.js 20+. No telemetry.

<p align="center">
  <img src="assets/screen-enth1.png" alt="enthropic cli" width="760"/>
  <br/>
  <img src="assets/screen-enth2.png" alt="enthropic cli" width="760"/>
</p>

## Commands

All commands are also available interactively - just run `enthropic`.

| Command | Description |
|---|---|
| `enthropic guide` | quick start guide for new users |
| `enthropic new` | create a new `.enth` spec with AI |
| `enthropic update [file]` | refine an existing spec with AI |
| `enthropic check [file]` | validate + lint, errors and warnings grouped by severity |
| `enthropic context [file]` | generate the AI context block from your spec and state |
| `enthropic state show [file]` | show build progress *(automation in progress)* |
| `enthropic state set <entity> <status> [file]` | update entity status *(automation in progress)* |
| `enthropic reverse [dir]` | reverse-engineer a codebase into a starter spec *(in development)* |
| `enthropic open` | open a project in `$EDITOR` |
| `enthropic delete` | delete a project |
| `enthropic setup` | configure AI provider, API key, and model |

`[file]` defaults to the `.enth` file in `~/.enthropic/workspace/<project>/`.

## Generated files

`enthropic check` on a valid spec creates:

**`state_[name].enth`** - build progress, updated as you work.

```
STATE myapp

  ENTITY
    user              PENDING
    session           PENDING
    order             PENDING

  LAYERS
    API               PENDING
    SERVICE           PENDING
    STORAGE           PENDING
```

---

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey.svg" alt="MIT"/></a>
  &nbsp;
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-20+-brightgreen.svg" alt="Node.js 20+"/></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/enthropic"><img src="https://img.shields.io/badge/npm-v1.3.0-ffafff.svg" alt="npm v1.3.0"/></a>
</p>
