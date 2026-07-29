# Open Design Agent Plugins

This is an agent-first, lightweight distribution repository for Open Design
plugins. Codex Desktop / Codex CLI is the first supported host.

## Give this repository to an agent

Give Codex this instruction:

> Read
> `https://github.com/nexu-io/open-design-agent-plugins/blob/main/AGENTS.md`
> and install the Open Design plugin into Codex. Follow the Install lane, preserve
> existing configuration, connect the plugin to the local `open-design` MCP,
> and report any Open Design or Vela-login prerequisite.

The detailed entrypoint is [`AGENTS.md`](AGENTS.md); a reusable prompt is in
[`AGENT_PROMPT.md`](AGENT_PROMPT.md).

## Architecture

The distribution plugin is intentionally small and contains no MCP server:

```text
Codex plugin
  -> local open-design MCP
  -> local Open Design daemon
  -> bundled Vela CLI
  -> remote Vela / AMR service
```

Users install Open Design and register its local MCP with Codex. The signed
runtime starts headlessly when needed; its Electron window does not need to
stay open. The plugin's default Cloud workflow uses `agent: "amr"`, browser
login through narrow local MCP tools, and the interactive `collect_brief` card.
There is no remote MCP dependency and no Codex-side Vela credential.

## Current package

- Marketplace: `open-design`
- Plugin: `open-design`
- Display name: `Open Design`
- Stable plugin selector: `open-design@open-design`
- Candidate version: `0.5.0`
- Host: Codex only
- Minimum Open Design: `0.17.0`
- Telemetry contract: schema v3, self-reported Plugin attribution
- MCP: local `open-design` stdio registration
- Cloud runtime: remote Vela/AMR via Open Design's bundled Vela CLI
- Optional modes: Local Codex and Local BYOK, explicit and never fallbacks

## Direct installation

```bash
codex plugin marketplace add nexu-io/open-design-agent-plugins --ref main --json
codex plugin add open-design@open-design --json
```

Then install its Codex MCP registration from Settings → MCP server, through the
signed packaged `--headless --mcp-install codex` operation, or with the
`od mcp install codex` command supplied by that Open Design installation.
Verify:

```bash
codex plugin list --json
codex mcp get open-design --json
```

When Cloud generation needs Vela login, the plugin can open browser
authorization through the local MCP without opening the Open Design GUI. Start
a new Codex task after plugin installation, then invoke
`@open-design`.

See [docs/INSTALL_CODEX.md](docs/INSTALL_CODEX.md) for isolated validation and
[docs/TELEMETRY.md](docs/TELEMETRY.md) for measurement boundaries.

## Source and release boundary

Product implementation remains in
[`nexu-io/open-design`](https://github.com/nexu-io/open-design). This repository
contains only the portable payload, marketplace metadata, release provenance,
and installation documentation.

Open Design product releases do not automatically change this repository.
Refresh the generated payload only when its plugin manifest, skill, package
contract, minimum Codex/Open Design version, or installation behavior changes.
Pure product fixes behind the stable local MCP contract require a new Open
Design release, not necessarily a new distribution-plugin version.

Host-specific payloads use `plugins/<host>/<plugin-name>/`; future Claude or
Gemini packages can live beside `codex/` without mixing host manifests.
