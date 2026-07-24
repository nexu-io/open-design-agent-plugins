# Open Design Agent Plugins

This is an agent-first, lightweight distribution repository for Open Design
plugins. The first supported host is Codex Desktop / Codex CLI.

## Give this repository to an agent

The agent entrypoint is [`AGENTS.md`](AGENTS.md). Give Codex this single
instruction:

> Read
> `https://github.com/nexu-io/open-design-agent-plugins/blob/main/AGENTS.md`
> and install Open Design Cloud into Codex. Follow the Install lane, verify the
> plugin and MCP registration, do not run OAuth login, and report the result.

The Agent will preflight the Codex version, preserve unrelated configuration,
install from this marketplace, verify the registered remote MCP, and tell you
to start a new task. A reusable version of the prompt is in
[`AGENT_PROMPT.md`](AGENT_PROMPT.md).

The product implementation remains in
[`nexu-io/open-design`](https://github.com/nexu-io/open-design). This repository
contains only the portable plugin payload, Codex marketplace metadata, and
distribution documentation. Do not implement Open Design or Vela business logic
here.

## Current package

- Marketplace: `open-design`
- Plugin: `open-design-cloud`
- Version: `0.1.1`
- Host: Codex only
- Runtime: remote Open Design Cloud (Vela) MCP
- Local Codex and Local BYOK: explicit, separate Open Design registrations; not
  bundled fallbacks

## Direct installation

```bash
codex plugin marketplace add nexu-io/open-design-agent-plugins --ref main --json
codex plugin add open-design-cloud@open-design --json
codex plugin list --json
codex mcp get open-design-cloud --json
```

Start a new Codex task after installation so that the plugin skills and MCP
registration are picked up. Cloud login is a separate runtime step:

```bash
codex mcp login open-design-cloud
```

The login command requires the real Open Design Cloud OAuth endpoints to be
available. Package installation can be tested independently.

See [docs/INSTALL_CODEX.md](docs/INSTALL_CODEX.md) for the isolated smoke test
and [docs/TELEMETRY.md](docs/TELEMETRY.md) for install/activation measurement
boundaries.

## Source and release boundary

Host-specific payloads use `plugins/<host>/<plugin-name>/`. The current Codex
payload is `plugins/codex/open-design-cloud/`; future Claude or Gemini packages
can live beside `codex/` without mixing incompatible host manifests.

`plugins/codex/open-design-cloud/` and `.agents/plugins/marketplace.json` were
materialized by Open Design's `tools-pack codex-cloud-plugin candidate`
generator. Make product changes and red specs in the Open Design repository,
then generate and validate a fresh candidate. Do not hand-fork the generated
plugin here.

The canonical distribution repository is
[`nexu-io/open-design-agent-plugins`](https://github.com/nexu-io/open-design-agent-plugins).
Publication still requires an explicit owner-approved commit and push; the
current local candidate must not be treated as published merely because the
remote repository exists.
