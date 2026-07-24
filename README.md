# Open Design Agent Plugins

This is the lightweight distribution repository for Open Design agent plugins.
The first supported host is Codex Desktop / Codex CLI.

The product implementation remains in
[`nexu-io/open-design`](https://github.com/nexu-io/open-design). This repository
contains only the portable plugin payload, Codex marketplace metadata, and
distribution documentation. Do not implement Open Design or Vela business logic
here.

## Current package

- Marketplace: `open-design`
- Plugin: `open-design-cloud`
- Version: `0.1.0`
- Host: Codex only
- Runtime: remote Open Design Cloud (Vela) MCP
- Local Codex and Local BYOK: explicit, separate Open Design registrations; not
  bundled fallbacks

## Local installation

```bash
codex plugin marketplace add /Users/cheems/cjj_project/open-design-agent-plugins --json
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

`plugins/open-design-cloud/` and `.agents/plugins/marketplace.json` were
materialized by Open Design's `tools-pack codex-cloud-plugin candidate`
generator. Make product changes and red specs in the Open Design repository,
then generate and validate a fresh candidate. Do not hand-fork the generated
plugin here.

This repository is currently local-only. It has no Git remote and must not be
pushed until the owner explicitly chooses the public repository and release
channel.
